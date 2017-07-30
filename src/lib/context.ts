import * as pathIsAbsolute from 'path-is-absolute'
import * as webpack from 'webpack'

// tslint:disable-next-line:no-var-requires
const MemoryFileSystem = require("memory-fs")

import initConfig from './config'
import { IContext } from './middleware_types'

// MemoryFileSystem requires an absolute path
function validOutputPath(compiler: any) {
    const path: any = compiler.outputPath
    if (typeof path === "string" &&
        !pathIsAbsolute.posix(path) &&
        !pathIsAbsolute.win32(path)) {
        throw new Error('output.path needs to be an absolute path.')
    }
}

function getFs(compiler: any) {
    validOutputPath(compiler)
    let filesystem = new MemoryFileSystem()
    if (!compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem) {
        filesystem = compiler.outputFileSystem
    } else {
        compiler.outputFileSystem = filesystem
    }
    return filesystem
}

export default function setContext(compiler: any): IContext {
    const filesystem = getFs(compiler)
    return {
        state: false,
        webpackStats: undefined,
        callbacks: [],
        compiler,
        watching: undefined,
        forceRebuild: false,
        fileSystem: getFs(compiler),
    }
}
