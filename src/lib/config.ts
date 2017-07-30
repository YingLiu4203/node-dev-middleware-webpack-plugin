import * as mime from 'mime'
import * as webpack from 'webpack'

// tslint:disable:no-var-requires
const timestamp = require('time-stamp')

import { IConfiguration, ReportFunction, WebpackStats } from './middleware_types'

function configReporter(options: IConfiguration) {
    if (typeof options.log !== 'function') {
        options.log = console.log.bind(console)
    }
    if (typeof options.warn !== 'function') {
        options.warn = console.warn.bind(console)
    }

    if (typeof options.error !== 'function') {
        options.error = console.log.bind(console)
    }

    const defaultReporter: ReportFunction = (args) => {
        const { state, stats, options: rptOptions } = args

        let time: string = ''
        if (rptOptions.reportTime) {
            time = '[' + timestamp('HH:mm:ss') + '] '
        }

        if (state) {
            let displayStats = !rptOptions.quiet && stats
            const isNormal = !(stats.hasErrors() || stats.hasWarnings())
            if (isNormal && rptOptions.noInfo) {
                displayStats = false
            }

            if (displayStats) {
                if (stats.hasErrors()) {
                    options.error!(stats.toString(stats));
                } else if (stats.hasWarnings()) {
                    options.warn!(stats.toString(stats));
                } else {
                    options.log!(stats.toString(stats));
                }
            }

            if (!rptOptions.noInfo && !rptOptions.quiet) {
                let msg = 'Compiled successfully.'
                if (stats.hasErrors()) {
                    msg = 'Failed to compile.'
                } else if (stats.hasWarnings()) {
                    msg = 'Compiled with warnings.'
                }
                options.log!(time + 'webpack: ' + msg)
            }
        } else {
            options.log!(time + 'webpack: Compiling...')
        }
    }

    if (typeof options.reporter !== 'function') {
        options.reporter = defaultReporter
    }
}

export default function initConfig(config: IConfiguration) {
    configReporter(config)

    if (config.stats === 'undefined') {
        config.stats = {} as webpack.Stats.ToStringOptions
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
