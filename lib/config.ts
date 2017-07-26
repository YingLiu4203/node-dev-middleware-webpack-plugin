import * as mime from 'mime'
import * as webpack from 'webpack'

// tslint:disable:no-var-requires
const timestamp = require('time-stamp')

import { IConfiguration, ReportFunction } from './middleware_types'

function configReporter(config: IConfiguration) {
    if (typeof config.log !== 'function') {
        config.log = console.log.bind(console)
    }
    if (typeof config.warn !== 'function') {
        config.warn = console.warn.bind(console)
    }

    if (typeof config.error !== 'function') {
        config.error = console.log.bind(console)
    }

    const defaultReporter: ReportFunction = (args) => {
        const {state, stats, options} = args

        let time: string = ''
        if (options.reportTime) {
            time = '[' + timestamp('HH:mm:ss') + '] '
        }

        if (state) {
            let displayStats = !options.quiet && stats
            const isNormal = !(stats.hasErrors() || stats.hasWarnings())
            if (isNormal && options.noInfo) {
                displayStats = false
            }

            if (displayStats) {
                if (stats.hasErrors()) {
                    config.error!(stats.toString(stats));
                } else if (stats.hasWarnings()) {
                    config.warn!(stats.toString(stats));
                } else {
                    config.log!(stats.toString(config.stats));
                }
            }

            if (!options.noInfo && !options.quiet) {
                let msg = 'Compiled successfully.'
                if (stats.hasErrors()) {
                    msg = 'Failed to compile.'
                } else if (stats.hasWarnings()) {
                    msg = 'Compiled with warnings.'
                }
                config.log!(time + 'webpack: ' + msg)
            }
        } else {
            config.log!(time + 'webpack: Compiling...')
        }
    }

    if (typeof config.reporter !== 'function')  {
        config.reporter = defaultReporter
    }
}

export default function initConfig(config: IConfiguration) {
    configReporter(config)

    const watchOptions = config.watchOptions
        ? config.watchOptions
        : {} as webpack.Options.WatchOptions
    if (!watchOptions.aggregateTimeout) {
        watchOptions.aggregateTimeout = 200
    }

    if (!config.stats) {
        config.stats = {} as webpack.Stats.ToStringOptionsObject
    }
    if (typeof config.stats === 'object' && !config.stats.context) {
        config.stats.context = process.cwd()
    }

    if (config.lazy) {
        if (typeof config.filename === 'string') {
            // replace a string like [abc] as [.+]
            const str = config.filename
                .replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
                .replace(/\\\[[a-z]+\\\]/ig, '.+');
            config.filename = new RegExp('^[\/]{0,1}' + str + '$');
        }
    }

    // defining custom MIME type in mime
    if (config.mimeTypes) {
        mime.define(config.mimeTypes)
    }
}
