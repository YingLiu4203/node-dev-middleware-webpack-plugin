import * as express from 'express'
import * as mime from 'mime'
import * as pathIsAbsolute from 'path-is-absolute'
import * as parseRange from 'range-parser'
import * as webpack from 'webpack'

import { IContext, IOptions, IReportOptions } from './middleware_types'

// tslint:disable:no-var-requires
const MemoryFileSystem = require('memory-fs')
const timestamp = require('time-stamp')

const HASH_REGEXP = /[0-9a-f]{10,}/

// tslint:disable-next-line:no-empty
const Nop = () => {}

export default function Shared(context: IContext) {
    const share = {
        setOptions(options: IOptions) {
            if (!options.reportTime) {
                options.reportTime = false
            }
            if (!options.watchOptions) {
                options.watchOptions = {} as webpack.Options.WatchOptions
            }
            if (typeof options.reporter !== 'function') {
                options.reporter = share.defaultReporter
            }
            if (typeof options.log !== 'function') {
                options.log = console.log.bind(console)
            }

            if (typeof options.warn !== 'function') {
                options.warn = console.warn.bind(console)
            }

            if (typeof options.error !== 'function') {
                options.error = console.error.bind(console)
            }

            if (!options.watchOptions.aggregateTimeout) {
                options.watchOptions.aggregateTimeout = 200
            }

            if (options.stats === 'undefined') {
                options.stats = {} as webpack.Stats.ToStringOptions
            }

            const stats = options.stats as webpack.Stats.ToStringOptionsObject
            if (!stats.context) {
                stats.context = process.cwd()
            }

            if (options.lazy) {
                if (typeof options.filename === 'string') {
                    const str = options.filename
                        .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
                        .replace(/\\\[[a-z]+\\\]/ig, '.+');
                    options.filename = new RegExp('^[\/]{0,1}' + str + '$');
                }
            }
            // defining custom MIME type
            if (options.mimeTypes) {
                mime.define(options.mimeTypes)
            }

            context.options = options
        },

        defaultReporter(reporterOptions: IReportOptions) {
            let time: string = ''
            const state = reporterOptions.state
            const stats = reporterOptions.stats
            const options = reporterOptions.options

            if (options.reportTime) {
                time = '[' + timestamp('HH:mm:ss') + '] '
            }
            if (state) {
                let displayStats = !options.quiet && options.stats
                const isNormal = !(stats.hasErrors() || stats.hasWarnings())
                if (isNormal && options.noInfo) {
                    displayStats = false
                }

                if (displayStats) {
                    if (stats.hasErrors()) {
                        options.error!(stats.toString(options.stats));
                    } else if (stats.hasWarnings()) {
                        options.warn!(stats.toString(options.stats));
                    } else {
                        options.log!(stats.toString(options.stats));
                    }
                }

                if (!options.noInfo && !options.quiet) {
                    let msg = 'Compiled successfully.';
                    if (stats.hasErrors()) {
                        msg = 'Failed to compile.';
                    } else if (stats.hasWarnings()) {
                        msg = 'Compiled with warnings.';
                    }
                    options.log!(time + 'webpack: ' + msg);
                }
            } else {
                options.log!(time + 'webpack: Compiling...');
            }
        },

        handleRangeHeaders: function handleRangeHeaders(
            content: any, req: express.Request, res: express.Response) {
            // assumes express API
            res.setHeader('Accept-Ranges', 'bytes')
            if (req.headers.range) {
                // TODO the req.headers.range migth be string[]
                const ranges = parseRange(content.length,
                    req.headers.range as string)

                // unsatisfiable
                if (parseRange.Result.unsatisifiable === ranges) {
                    res.setHeader('Content-Range', 'bytes */' + content.length)
                    res.statusCode = 416    // range not satisfiable
                }

                // syntactically invalid and multiple ranges
                // are treated as a regular response)
                if (parseRange.Result.unsatisifiable !== ranges) {
                    const parsedRanges = ranges as parseRange.Ranges
                    const start = parsedRanges[0].start
                    const end = parsedRanges[0].end
                    if (parsedRanges.length === 1) {
                        // Content-Range
                        res.statusCode = 206 // partial content
                        const length = content.length;
                        res.setHeader(
                            'Content-Range',
                            'bytes ' + start + '-' + end + '/' + length,
                        )
                        content = content.slice(start, end + 1)
                    }
                }
            }
            return content;
        },

        setFs(compiler: webpack.Compiler) {
            // store our files in memory
            let fs;
            const isMemoryFs = compiler.outputFileSystem
                instanceof MemoryFileSystem
            if (isMemoryFs) {
                fs = compiler.outputFileSystem;
            } else {
                fs = compiler.outputFileSystem = new MemoryFileSystem();
            }
            context.fileSystem = fs;
        },

        compilerDone(stats: webpack.Stats) {
            // We are now on valid state
            context.state = true;
            context.webpackStats = stats;

            // Do the stuff in nextTick, because bundle may be invalidated
            // if a change happened while compiling
            process.nextTick(() => {
                // check if still in valid state
                if (!context.state) {
                    return
                }

                // print webpack output
                context.options!.reporter!({
                    state: true,
                    stats,
                    options: context.options,
                })

                // execute callback that are delayed
                const cbs = context.callbacks
                context.callbacks = []
                cbs.forEach(function continueBecauseBundleAvailable(cb) {
                    cb(stats);
                })
            });

            // In lazy mode, we may issue another rebuild
            if (context.forceRebuild) {
                context.forceRebuild = false;
                share.rebuild();
            }
        },

        compilerInvalid() {
            if (context.state && (!context.options.noInfo
                && !context.options.quiet)) {
                context.options.reporter!({
                    state: false,
                    options: context.options,
                })
            }

            // We are now in invalid state
            context.state = false;
            // resolve async
            if (arguments.length === 2 && typeof arguments[1] === 'function') {
                const callback = arguments[1]
                callback()
            }
        },

        // if ready, call the fn, otherwise, save to callbacks
        ready(fn: any, req?: express.Request) {
            const options = context.options
            if (context.state) {
                return fn(context.webpackStats)
            }

            if (!options.noInfo && !options.quiet && req) {
                options.log!('webpack: wait until bundle finished: '
                    + (req.url || fn.name))
            }
            context.callbacks.push(fn)
        },

        startWatch() {
            const options = context.options
            const compiler = context.compiler
            // start watching
            if (!options.lazy) {
                const watching = compiler.watch(
                    options.watchOptions!, share.handleCompilerCallback)
                context.watching = watching;
            } else {
                context.state = true;
            }
        },

        rebuild() {
            if (context.state) {
                context.state = false;
                context.compiler.run(share.handleCompilerCallback);
            } else {
                context.forceRebuild = true;
            }
        },

        handleCompilerCallback(err: any) {
            if (err) {
                context.options.error!(err.stack || err)
                if (err.details) {
                    context.options.error!(err.details)
                }
            }
        },

        handleRequest(filename: string,
                      processRequest: () => void,
                      req: express.Request) {
            // in lazy mode, rebuild on bundle request
            if (context.options.lazy && (!context.options.filename
                || (context.options.filename as RegExp).test(filename))) {
                share.rebuild()
            }
            if (HASH_REGEXP.test(filename)) {
                try {
                    if (context.fileSystem.statSync(filename).isFile()) {
                        processRequest();
                        return;
                    }
                } catch (e) {
                    context.options.warn!((e as Error).message)
                }
            }
            share.ready(processRequest, req);
        },

        waitUntilValid(callback: any) {
            callback = callback || Nop
            share.ready(callback, {});
        },

        invalidate(callback: any) {
            callback = callback || Nop
            if (context.watching) {
                share.ready(callback);
                context.watching.invalidate();
            } else {
                callback();
            }
        },

        close(callback: any) {
            callback = callback || Nop
            if (context.watching) {
                context.watching.close(callback)
            } else {
                callback()
            }
        },
    }

    share.setOptions(context.options);
    share.setFs(context.compiler);

    context.compiler.plugin('done', share.compilerDone);
    context.compiler.plugin('invalid', share.compilerInvalid);
    context.compiler.plugin('watch-run', share.compilerInvalid);
    context.compiler.plugin('run', share.compilerInvalid);

    share.startWatch();
    return share;
}
