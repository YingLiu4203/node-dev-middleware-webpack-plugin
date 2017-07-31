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

    const middlewareConig = {
        stats: 'errors-only' as webpack.Stats.Preset,
        quiet: true,
        publicPath: '/public/',
    }

    const bundleFilename = middlewareConig.publicPath + webpackConfig.output.filename

    describe('requests', () => {
        before((done) => {
            app = express()
            const compiler = webpack(webpackConfig)
            const instance = middleware(compiler, middlewareConig)
            app.use(instance)
            server = listenShorthand(done)
            // Hack to add a mock HMR json file to the in-memory filesystem.
            instance.fileSystem.writeFileSync('/123a123412.hot-update.json', '[\'hi\']')
        })

        after(close)

        it('GET request to bundle file', (done) => {
            request(app).get(bundleFilename)
                .expect('Content-Type', 'application/javascript; charset=UTF-8')
                .expect(200, /console\.log\('Foo\.'\)/, done)
        })

        it("POST request to bundle file returns 404", (done) => {
            request(app).post(bundleFilename).expect(404, done)
        })

        it("request to image", (done) => {
            request(app).get("/public/svg.svg")
                .expect("Content-Type", "image/svg+xml; charset=UTF-8")
                .expect("Content-Length", "4778")
                .expect(200, done)
        })

        it("request to non existing file returns 404", (done) => {
            request(app).get("/public/nope")
                .expect("Content-Type", "text/html; charset=utf-8")
                .expect(404, done)
        })

        it("request to HMR json", (done) => {
            request(app).get("/public/123a123412.hot-update.json")
                .expect("Content-Type", "application/json; charset=UTF-8")
                .expect(200, /\[\"hi\"\]/, done)
        })

        it("request to directory", (done) => {
            request(app).get("/public/")
                .expect("Content-Type", "text/html; charset=UTF-8")
                .expect("Content-Length", "10")
                .expect(200, /My\ Index\./, done)
        })

        it("invalid range header", (done) => {
            request(app).get("/public/svg.svg")
                .set("Range", "bytes=6000-")
                .expect(416, done)
        })

        it("valid range header", (done) => {
            request(app).get("/public/svg.svg")
                .set("Range", "bytes=3000-3500")
                .expect("Content-Length", "501")
                .expect("Content-Range", "bytes 3000-3500/4778")
                .expect(206, done)
        })

        it("request to non-public path", (done) => {
            request(app).get("/nonpublic/")
                .expect("Content-Type", "text/html; charset=utf-8")
                .expect(404, done)
        })
    })
})
