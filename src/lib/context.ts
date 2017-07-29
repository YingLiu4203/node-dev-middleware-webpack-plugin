import * as pathIsAbsolute from 'path-is-absolute'
import * as webpack from 'webpack'

// tslint:disable-next-line:no-var-requires
const MemoryFileSystem = require("memory-fs")

import initConfig from './config'
import { IConfiguration, IContext } from './middleware_types'

function setFs(compiler: any) {
    let filesystem = new MemoryFileSystem()
    if (compiler instanceof webpack.Compiler) {
        if (compiler.outputFileSystem instanceof MemoryFileSystem) {
            filesystem = compiler.outputFileSystem
        } else {
            compiler.outputFileSystem = filesystem
        }
    }
    return filesystem
}

export default function setContext(compiler: any): IContext {
    const filesystem = setFs(compiler)
    return {
        state: false,
        webpackStats: undefined,
        callbacks: [],
        compiler,
        watching: undefined,
        forceRebuild: false,
        fileSystem: setFs(compiler),
    }
}
