import * as pathIsAbsolute from 'path-is-absolute'
import * as webpack from 'webpack'

// tslint:disable-next-line:no-var-requires
const MemoryFileSystem = require("memory-fs")

import initConfig from './config'
import { IConfiguration, IContext, WebpackCompiler } from './middleware_types'

function setFs(compiler: WebpackCompiler) {
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

export default function setContext(compiler: WebpackCompiler, options: IConfiguration): IContext {
    initConfig(options)
    const filesystem = setFs(compiler)
    return {
        state: false,
        webpackStats: undefined,
        callbacks: [],
        options,
        compiler,
        watching: undefined,
        forceRebuild: false,
        fileSystem: setFs(compiler),
    }
}
