import * as express from 'express'
import * as webpack from 'webpack'

import {
    FunctionVoid,
    IConfiguration, IContext,
    IDevMiddleWare,
} from './middleware_types'

import initConfig from './config'
import setContext from './context'
import { sendContent } from './express_helper'
import { getFilename, joinPath } from './file_helper'
import getFilenameFromUrl from './get_filename_from_url'
import setMiddleware from './set_middleware'

export default function(this: any, compiler: any, options: IConfiguration) {
    initConfig(options)
    const context: IContext = setContext(compiler)
    const { ready, handleRequest, setProps } = setMiddleware(context, options)

    // The express middleware
    const devMiddleware = ((
        req: express.Request,
        res: express.Response,
        next: express.NextFunction) => {

        function goNext() {
            if (options.serverSideRender) {
                return new Promise<void>((resolve) => {
                    ready(() => {
                        res.locals.webpackStats = context.webpackStats
                        resolve(next())
                    }, req)
                })
            } else {
                return next()
            }
        }

        if (req.method !== "GET") {
            return goNext()
        }

        let filename = getFilenameFromUrl(options.publicPath, context.compiler, req.url)
        if (!filename) {
            return goNext()
        }

        return new Promise<void>((resolve) => {
            function processRequest() {
                try {
                    filename = getFilename(
                        filename as string, context.fileSystem, options.index)
                } catch (e) {
                    return resolve(goNext())
                }
                sendContent(filename, context.fileSystem, req, res, options.headers)
                resolve()
            }

            handleRequest(filename as string, processRequest, req)
        })
    }) as IDevMiddleWare

    setProps(devMiddleware)
    return devMiddleware
}
