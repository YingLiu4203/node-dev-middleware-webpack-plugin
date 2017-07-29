import { unescape } from 'querystring'
import * as querystring from 'querystring'
import { parse as urlParse } from 'url'

import * as webpack from 'webpack'

import { joinPath } from './file_helper'

/**
 * Get the comipler's output path, search a matched compiler if there are multiple compilers.
 * @param compiler The webpack compiler.
 * @param url The request url.
 * @returns The matched compiler's output path and public path.
 */
function getPaths(publicPath: string, compiler: any, url: string) {
    const compilers = compiler && compiler.compilers
    if (Array.isArray(compilers)) {
        let compilerPublicPath
        for (const element of compilers) {
            compilerPublicPath = element.options
                && element.options.output
                && element.options.output.publicPath
            if (url.indexOf(compilerPublicPath) === 0) {
                return {
                    publicPath: compilerPublicPath,
                    outputPath: element.outputPath,
                }
            }
        }
    }
    return { publicPath, outputPath: compiler.outputPath }
}

/**
 * Get the local filename from the request url based on the public path in the middleware
 * configuration and the output path in the webpack configuration.
 * @param {string} [cofigPublicPath='/'] The publicPath option in middleware configuration.
 * @param {*} compiler The webpack compiler.
 * @param {string} The request url.
 * @returns {string} The local filename requested by the url. Empty if not matched.
 */
export default function(cofigPublicPath = '/', compiler: any, url: string): string {
    const {publicPath, outputPath} = getPaths(cofigPublicPath, compiler, url)

    const configUrl = urlParse(publicPath, false, true)
    const reqestUrl = urlParse(url)

    // match even when one hostname is misssing
    const matchedHostname =
        (configUrl.hostname === reqestUrl.hostname) ||
        (!reqestUrl.hostname && configUrl.hostname) ||
        (reqestUrl.hostname && !configUrl.hostname)

    const matchedPathname = reqestUrl.pathname!.indexOf(configUrl.pathname!) === 0

    let filename = ''
    if (matchedHostname && matchedPathname) {
        const strippedUrlPathname = reqestUrl.pathname!.substr(configUrl.pathname!.length)
        filename = joinPath(outputPath, strippedUrlPathname)
    }
    return querystring.unescape(filename)
}
