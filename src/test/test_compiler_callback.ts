import 'mocha'

import { expect } from 'chai'

import middleware from '../lib/middleware'

// tslint:disable-next-line:no-var-requires
const sinon = require('sinon')

describe('Compiler Watch Callbacks', () => {
    let plugins: any = {}
    const compiler = {  // a fake one for test
        // tslint:disable-next-line:no-empty
        watch() { },
        plugin(name: string, callback: any) {
            plugins[name] = callback
        },
    }

    let watchStub: any
    const error = new Error('Oh noes!')

    beforeEach(() => {
        plugins = {}
        watchStub = sinon.stub(compiler, 'watch').callsFake((opts: any, callback: any) => {
            callback(error)
        })
    })

    afterEach(() => watchStub.restore())

    it('watch error should be reported to options.error', (done) => {
        const errorSpy = sinon.spy()
        middleware(compiler, { error: errorSpy })

        // tslint:disable:no-unused-expression
        expect(errorSpy.withArgs(error.stack).calledOnce).to.be.true
        done()
    })
})
