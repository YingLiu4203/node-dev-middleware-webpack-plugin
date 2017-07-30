import { expect } from 'chai'
import * as express from 'express'
import * as http from 'http'
import * as request from 'supertest'
import * as webpack from 'webpack'

import 'mocha'

import middleware from '../lib/middleware'
import webpackConfig from './fixtures/webpack.config'

describe('server', () => {

    let app: express.Express
    let server: http.Server

    function listenShorthand(done: any) {
        return app.listen(8000, '127.0.0.1', (err: any) => {
            if (err) {
                done(err)
            } else {
                done()
            }
        })
    }

    function close(done: any) {
        if (server) {
            server.close(done);
        } else {
            done()
        }
    }

    describe('requests', () => {
        before((done) => {
            app = express()
            const compiler = webpack(webpackConfig)
            const instance = middleware(compiler, {
                stats: 'errors-only',
                quiet: true,
                publicPath: '/public/',
            })
            app.use(instance)
            server = listenShorthand(done)
            // Hack to add a mock HMR json file to the in-memory filesystem.
            instance.fileSystem.writeFileSync('/123a123412.hot-update.json', '[\'hi\']')
        })

        after(close)

        it('GET request to bundle file', (done) => {
            request(app).get('/public/bundle.js')
                .expect('Content-Type', 'application/javascript; charset=UTF-8')
                .expect('Content-Length', '2823')
                .expect(200, /console\.log\('Hey\.'\)/, done)
        })
    })
})
