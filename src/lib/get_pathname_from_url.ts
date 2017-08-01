import { unescape } from 'querystring'
import * as queryString from 'querystring'
import { parse as parseUrl } from 'url'

import * as webpack from 'webpack'

import { joinPath } from './file_helper'

function setPathDefault(publicPath: string, compiler: any) {
    if (!publicPath) {
        publicPath = '/'
    }

    let outputPath = compiler.outputPath
    if (!outputPath) {
        outputPath = '/'
    }
    return {publicPath, outputPath}
}

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
                return setPathDefault(compilerPublicPath, element)
            }
        }
    }
    return setPathDefault(publicPath, compiler)
}

/**
 * Get the local filename from the request url based on the public path in the middleware
 * configuration and the output path in the webpack configuration.
 * @param {string} cofigPublicPath The publicPath option in middleware configuration.
 * @param {*} compiler The webpack compiler.
 * @param {string} The request url.
 * @returns {string} The local filename requested by the url. Return an empty string if not matched.
 */
export default function(cofigPublicPath = '/', compiler: any, url: string): string {
    const {publicPath, outputPath} = getPaths(cofigPublicPath, compiler, url)

    // use classic parse API to handle path without a base
    const configUrl = parseUrl(publicPath, false, true)
    const reqestUrl = parseUrl(url)

    // match even when one hostname is misssing
    const matchedHostname =
        (configUrl.hostname === reqestUrl.hostname) ||
        (!reqestUrl.hostname && configUrl.hostname) ||
        (reqestUrl.hostname && !configUrl.hostname)

    const matchedPathname = reqestUrl.pathname!.indexOf(configUrl.pathname!) === 0

    let pathname = ''
    if (matchedHostname && matchedPathname) {
        const strippedUrlPathname = reqestUrl.pathname!.substr(configUrl.pathname!.length)
        if (strippedUrlPathname) {
            pathname = joinPath(outputPath, strippedUrlPathname)
        } else {
            pathname = outputPath
        }
    }

    return unescape(pathname)
}
