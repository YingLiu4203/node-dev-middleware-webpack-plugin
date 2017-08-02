import 'mocha'

import { expect } from 'chai'

import middleware from '../lib/middleware'

// tslint:disable-next-line:no-var-requires
const sinon = require('sinon')

const doneStats = {
    hasErrors() {
        return false;
    },
    hasWarnings() {
        return false;
    },
}

describe("Lazy mode", () => {
    let instance: any
    let next: any
    const res = {}

    let plugins: any = []

    const compiler = {
        plugin: (name: any, callback: any) => {
            plugins[name] = callback;
        },
    } as any

    beforeEach(() => {
        plugins = {}
        compiler.run = sinon.stub();
        next = sinon.stub();
    })

    describe("builds", () => {
        const req = { method: "GET", url: "/bundle.js" };
        beforeEach(() => {
            sinon.stub(console, "error");
            instance = middleware(compiler, { lazy: true, quiet: true });
        });
        it("should trigger build", (done) => {
            instance(req, res, next);
            expect(compiler.run.callCount).to.equals(1)
            plugins.done(doneStats);
            setTimeout(() => {
                expect(next.callCount).to.equal(1)
                done()
            })
        })

        it("should trigger rebuild when state is invalidated", (done) => {
            plugins.invalid()
            instance(req, res, next)
            plugins.done(doneStats)

            expect(compiler.run.callCount).to.equals(1)
            setTimeout(() => {
                expect(next.callCount).to.equal(0)
                done()
            })
        })

        it("should pass through compiler error", (done) => {
            const error = new Error("MyCompilerError")
            compiler.run.callsArgWith(0, error)
            instance(req, res, next)
            expect((console.error as any).callCount).to.equal(1)
            // tslint:disable-next-line:no-unused-expression
            expect((console.error as any).calledWith(error.stack)).to.be.true
            done()
        })
    });

    describe("custom filename", () => {
        it("should trigger build", () => {
            instance = middleware(compiler, { lazy: true, quiet: true, filename: "foo.js" })

            let req = { method: "GET", url: "/bundle.js" }
            instance(req, res, next);
            expect(compiler.run.callCount).to.equals(0)

            req = { method: "GET", url: "/foo.js" }
            instance(req, res, next);
            expect(compiler.run.callCount).to.equals(1)
        })

        it("should allow prepended slash", () => {
            const options = { lazy: true, quiet: true, filename: "/foo.js" };
            instance = middleware(compiler, options)

            const req = { method: "GET", url: "/foo.js" }
            instance(req, res, next)
            expect(compiler.run.callCount).to.equals(1)
        })
    })
})
