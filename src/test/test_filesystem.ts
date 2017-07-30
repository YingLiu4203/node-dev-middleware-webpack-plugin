import { expect } from 'chai'
import 'mocha'

import middleware from '../lib/middleware'

// tslint:disable-next-line:no-var-requires
const MemoryFileSystem = require("memory-fs")

function fakeWebpack(): any {
    return {
        watch() {
            return {}
        },
        // tslint:disable-next-line:no-empty
        plugin() {},
    }
}

describe("FileSystem", () => {
    it("should set outputFileSystem on compiler", () => {
        const compiler = fakeWebpack()
        middleware(compiler)
        // tslint:disable-next-line:no-unused-expression
        expect(compiler.outputFileSystem).instanceof(MemoryFileSystem)
    })

    it("should reuse outputFileSystem from compiler", () => {
        const compiler = fakeWebpack()
        middleware(compiler)
        const firstFs = compiler.outputFileSystem
        middleware(compiler)
        const secondFs = compiler.outputFileSystem

        expect(firstFs).to.equal(secondFs)
    })

    it("should throw on invalid outputPath config", () => {
        const compiler = fakeWebpack()
        compiler.outputPath = "./dist"
        expect(() => middleware(compiler)).throw(Error, 'output.path')
    })

    it("should not throw on valid outputPath config for Windows", () => {
        const compiler = fakeWebpack()
        compiler.outputPath = "C:/my/path"
        expect(() => middleware(compiler)).to.not.throw(Error, 'output.path')
    })
})
