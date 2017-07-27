import { unescape } from 'querystring'
import * as querystring from 'querystring'
import { parse as parseUrl } from 'url'

import * as webpack from 'webpack'

import { joinPath } from './file_helper'

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
    return {
        publicPath,
        outputPath: compiler.outputPath,
    }
}

function getFilenameFromUrl(publicPath: string, outputPath: string, url: string) {
    let filename: string = ''

    // localPrefix is the folder our bundle should be in
    const localPrefix = parseUrl(publicPath || "/", false, true)
    const urlObject = parseUrl(url)

    // publicPath has the hostname that is not the same as request url's, should fail
    if (localPrefix.hostname !== null && urlObject.hostname !== null &&
        localPrefix.hostname !== urlObject.hostname) {
        return false
    }

    // publicPath is not in url, so it should fail
    if (publicPath && localPrefix.hostname === urlObject.hostname &&
        url.indexOf(publicPath) !== 0) {
        return false
    }

    // strip localPrefix from the start of url
    if (urlObject.pathname!.indexOf(localPrefix.pathname!) === 0) {
        filename = urlObject.pathname!.substr(localPrefix.pathname!.length)
    }

    if (!urlObject.hostname && localPrefix.hostname &&
        url.indexOf(localPrefix.path!) !== 0) {
        return false
    }
    // and if not match, use outputPath as filename
    return querystring.unescape(filename ? joinPath(outputPath, filename) : outputPath)
}

export default function(publicPath: string, compiler: any, url: string) {
    const paths = getPaths(publicPath, compiler, url)
    return getFilenameFromUrl(paths.publicPath, paths.outputPath, url)
}
