import { unescape } from 'querystring'
import * as querystring from 'querystring'
import { parse as urlParse } from 'url'

import * as webpack from 'webpack'

import { joinPath } from './file_helper'

/**
 * Get the comipler's output path, search if there are multiple compilers.
 * @param compiler The webpack compiler.
 * @param url The request url.
 * @returns The matched compiler's output path
 */
function getOutputPath(compiler: any, url: string): string {
    const compilers = compiler && compiler.compilers
    if (Array.isArray(compilers)) {
        let compilerPublicPath
        for (const element of compilers) {
            compilerPublicPath = element.options
                && element.options.output
                && element.options.output.publicPath
            if (url.indexOf(compilerPublicPath) === 0) {
                return element.outputPath
            }
        }
    }
    return compiler.outputPath
}

/**
 * Get the local filename from the request url based on the public path in the middleware
 * configuration and the output path in the webpack configuration.
 * @param {string} [publicPath='/'] The publicPath option in middleware configuration.
 * @param {*} compiler The webpack compiler.
 * @param {string} The request url.
 * @returns {(string | boolean)} The local filename requested by the url.
 */
export default function(publicPath = '/', compiler: any, url: string): string | boolean {
    const configUrl = urlParse(publicPath, false, true)
    const reqestUrl = urlParse(url)

    const outputPath = getOutputPath(compiler, url)

    // both config and request have hostname, fail if they are different
    if (configUrl.hostname !== null && reqestUrl.hostname !== null &&
        configUrl.hostname !== reqestUrl.hostname) {
        return false
    }

    // same hostname but publicPath is not in url, fail
    if (configUrl.hostname === reqestUrl.hostname && url.indexOf(publicPath) !== 0) {
        return false
    }

    if (!reqestUrl.hostname && configUrl.hostname && url.indexOf(configUrl.pathname!) !== 0) {
        return false
    }

    let filename = outputPath
    // strip localPrefix from the start of url
    if (reqestUrl.pathname!.indexOf(configUrl.pathname!) === 0) {
        const strippedUrlPathname = reqestUrl.pathname!.substr(configUrl.pathname!.length)
        filename = joinPath(outputPath, strippedUrlPathname)
    }

    return querystring.unescape(filename)
}
