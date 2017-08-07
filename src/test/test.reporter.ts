import 'mocha'

import { expect } from 'chai'

import middleware from '../lib/middleware'

import * as fs from 'fs'
import * as path from 'path'

// tslint:disable:no-var-requires
const timestamp = require('time-stamp')
const sinon = require('sinon')

const extendedStats = fs.readFileSync(path.join(__dirname, 'fixtures', 'stats.txt'), 'utf8')

const simpleStats = {
    hasErrors() {
        return false
    },
    hasWarnings() {
        return false
    },
}

const errorStats = {
    hasErrors() {
        return true
    },
    hasWarnings() {
        return false
    },
}

const warningStats = {
    hasErrors() {
        return false
    },
    hasWarnings() {
        return true
    },
}

describe('Reporter', () => {
    let plugins: any = {}
    let errorSpy: any
    let warnSpy: any
    let logSpy: any

    const compiler = {
        watch() {
            return {
                // tslint:disable-next-line:no-empty
                invalidate() { },
            }
        },
        plugin(name: string, callback: any) {
            plugins[name] = callback
        },
    }

    const config = (reportTime = false, noInfo = false, quiet = false) => {
        return {
            error: errorSpy,
            warn: warnSpy,
            log: logSpy,
            reportTime,
            noInfo,
            quiet,
        }
    }

    beforeEach(() => {
        plugins = {}
        errorSpy = sinon.spy()
        warnSpy = sinon.spy()
        logSpy = sinon.spy()
    })

    describe('compilation messages', () => {
        it('should show "compiled successfully" message', (done) => {
            middleware(compiler, config())

            plugins.done(simpleStats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(2)
                expect(warnSpy.callCount).to.equal(0)
                expect(errorSpy.callCount).to.equal(0)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('webpack: Compiled successfully.')).to.be.true
                done()
            })
        })

        it('should show "Failed to compile" message in console.error', (done) => {
            middleware(compiler, config())

            plugins.done(errorStats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                expect(warnSpy.callCount).to.equal(0)
                expect(errorSpy.callCount).to.equal(1)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('webpack: Failed to compile.')).to.be.true
                done()
            })
        })

        it('should show compiled successfully message, with log time', (done) => {
            middleware(compiler, config(true))

            plugins.done(simpleStats)
            setTimeout(() => {

                expect(logSpy.callCount).to.equal(2)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('[' + timestamp('HH:mm:ss') + '] webpack: Compiled successfully.')).to.be.true
                done()
            })
        })

        it('should show compiled successfully message, with log time', (done) => {
            middleware(compiler, config(true))

            plugins.done(errorStats)
            setTimeout(() => {
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('[' + timestamp('HH:mm:ss') + '] webpack: Failed to compile.')).to.be.true
                done()
            })
        })

        it('should show compiled with warnings message', (done) => {
            middleware(compiler, config())

            plugins.done(warningStats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                expect(warnSpy.callCount).to.equal(1)
                expect(errorSpy.callCount).to.equal(0)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('webpack: Compiled with warnings.')).to.be.true
                done()
            })
        })

        it('should show compiled with warnings message, with log time', (done) => {
            middleware(compiler, config(true))

            plugins.done(warningStats)
            setTimeout(() => {
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('[' + timestamp('HH:mm:ss') + '] webpack: Compiled with warnings.')).to.be.true
                done()
            })
        })

        it('should not show valid message if options.quiet is given', (done) => {
            middleware(compiler, config(false, false, true))

            plugins.done(simpleStats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })

        it('should not show valid message if options.noInfo is given', (done) => {
            middleware(compiler, config(false, true))

            plugins.done(simpleStats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })

        it('should show invalid message', (done) => {
            middleware(compiler, config())
            plugins.done(simpleStats)
            plugins.invalid()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('webpack: Compiling...')).to.be.true
                done()
            })
        })

        it('should show invalid message, with log time', (done) => {
            middleware(compiler, config(true))
            plugins.done(simpleStats)
            plugins.invalid()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('[' + timestamp('HH:mm:ss') + '] webpack: Compiling...')).to.be.true
                done()
            })
        })

        it('should not show invalid message if options.noInfo is given', (done) => {
            middleware(compiler, config(false, true))

            plugins.done(simpleStats)
            plugins.invalid()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })

        it('should not show invalid message if options.quiet is given', (done) => {
            middleware(compiler, config(false, false, true))

            plugins.done(simpleStats)
            plugins.invalid()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })
    })

    describe('stats output', () => {
        const stats = {
            hasErrors() {
                return false
            },
            hasWarnings() {
                return false
            },
            toString() {
                return extendedStats
            },
        }

        it('should print stats', (done) => {
            middleware(compiler, config())

            plugins.done(stats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(2)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith(stats.toString())).to.be.true
                done()
            })
        })

        it('should not print stats if options.stats is false', (done) => {
            const options: any = config()
            options.stats = false

            middleware(compiler, options)

            plugins.done(stats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                done()
            })
        })

        it('should not print stats if options.quiet is true', (done) => {
            middleware(compiler, config(false, false, true))

            plugins.done(stats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })

        it('should not print stats if options.noInfo is true', (done) => {
            middleware(compiler, config(false, true))

            plugins.done(stats)
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })
    })

    describe('wait until bundle valid', () => {
        it('should print message', (done) => {
            const instance = middleware(compiler, config())

            plugins.invalid()
            // tslint:disable-next-line:no-empty
            instance.invalidate(function myInvalidateFunction() { })
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(1)
                // tslint:disable-next-line:no-unused-expression
                expect(logSpy.calledWith('dev-middleware: wait until bundle finished: myInvalidateFunction')).to.be.true
                done()
            })
        })

        it('should not print if options.quiet is true', (done) => {
            const instance = middleware(compiler, config(false, false, true))

            plugins.invalid()
            instance.invalidate()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })

        it('should not print if options.noInfo is true', (done) => {
            const instance = middleware(compiler, config(false, true))

            plugins.invalid()
            instance.invalidate()
            setTimeout(() => {
                expect(logSpy.callCount).to.equal(0)
                done()
            })
        })
    })

    describe('custom reporter', () => {
        it('should allow a custom reporter', (done) => {
            middleware(compiler, {
                reporter(reporterOptions) {
                    // tslint:disable:no-unused-expression
                    expect(reporterOptions.state).to.be.true
                    expect(reporterOptions.stats).to.be.ok
                    expect(reporterOptions.options).to.be.ok
                    done()
                },
            })

            plugins.done(simpleStats)
        })
    })
})
