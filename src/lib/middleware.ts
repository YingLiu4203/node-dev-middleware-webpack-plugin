import * as express from 'express'
import * as webpack from 'webpack'

import { IConfiguration, IContext, IDevMiddleWare } from './middleware_types'

import initConfig from './config'
import setContext from './context'
import sendContent from './express_helper'
import { getFilename } from './file_helper'
import getPathnameFromUrl from './get_pathname_from_url'
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
                return ready(() => {
                    res.locals.webpackStats = context.webpackStats
                    next()
                }, req)
            } else {
                return next()
            }
        }

        if (req.method !== "GET") {
            return goNext()
        }

        const pathname = getPathnameFromUrl(options.publicPath, context.compiler, req.url)
        if (!pathname) {
            return goNext()
        }

        function processRequest() {
            const filename = getFilename(pathname, context.fileSystem, options.index)
            if (filename) {
                sendContent(filename, context.fileSystem, req, res, options.headers)
            } else {
                return goNext()
            }
        }

        return handleRequest(pathname, processRequest, req)

    }) as IDevMiddleWare

    setProps(devMiddleware)
    return devMiddleware
}
