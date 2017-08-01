import * as express from 'express'
import * as webpack from 'webpack'

import { IConfiguration, IContext, IDevMiddleWare } from './middleware_types'

import initConfig from './config'
import setContext from './context'
import sendContent from './express_helper'
import { getFilename } from './file_helper'
import getPathnameFromUrl from './get_pathname_from_url'
import setMiddleware from './set_middleware'

export default function(compiler: any, options = {} as IConfiguration) {

    initConfig(options)
    const context: IContext = setContext(compiler)
    const { ready, handleRequest, setProps } = setMiddleware(context, options)

    // The express middleware
    async function devMiddleware(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction) {

        function goNext() {
            if (options.serverSideRender) {
                return ready(async () => {
                    res.locals.webpackStats = context.webpackStats
                    await next()
                }, req)
            } else {
                return next()
            }
        }

        if (req.method !== "GET") {
            await goNext()
            return
        }

        const pathname = getPathnameFromUrl(options.publicPath, context.compiler, req.url)
        if (!pathname) {
            await goNext()
            return
        }

        async function processRequest() {
            const filename = getFilename(pathname, context.fileSystem, options.index)
            if (filename) {
                await sendContent(filename, context.fileSystem, req, res, options.headers)
            } else {
                await goNext()
            }
        }

        await handleRequest(pathname, processRequest, req)
    }

    setProps(devMiddleware as IDevMiddleWare)
    return devMiddleware as IDevMiddleWare
}
