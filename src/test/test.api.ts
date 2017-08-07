import 'mocha'

import { expect } from 'chai'

import middleware from '../lib/middleware'

const options = {
    quiet: true,
    publicPath: '/public/',
}

describe('Advanced API', () => {

    let plugins: any = {}
    let invalidationCount = 0
    let closeCount = 0

    const compiler = {
        outputPath: '/output',
        watch() {
            return {
                invalidate() {
                    invalidationCount += 1
                },
                close(callback: any) {
                    closeCount += 1
                    callback()
                },
            }
        },
        plugin(name: string, callback: any) {
            plugins[name] = callback
        },
    }
    beforeEach(() => {
        plugins = {}
        invalidationCount = 0
        closeCount = 0
    })
    const doneStats = {
        hasErrors() {
            return false
        },
        hasWarnings() {
            return false
        },
    }

    describe('waitUntilValid', () => {
        it('should wait for bundle done', (done) => {
            let doneCalled = false
            const instance = middleware(compiler, options)
            instance.waitUntilValid(() => {
                if (doneCalled) {
                    done()
                } else {
                    done(new Error('`waitUntilValid` called before bundle was done'))
                }
            })

            setTimeout(() => {
                plugins.done(doneStats)
                doneCalled = true
            }, 100)
        })

        it('callback should be called when bundle is already done', (done) => {
            const instance = middleware(compiler, options)
            plugins.done(doneStats)
            setTimeout(() => {
                instance.waitUntilValid(() => {
                    done()
                })
            })
        })

        it('should work without callback', () => {
            const instance = middleware(compiler, options)
            plugins.done(doneStats)
            setTimeout(() => {
                instance.waitUntilValid()
            })
        })

        it('callback should have stats argument', (done) => {
            const instance = middleware(compiler, options)
            plugins.done(doneStats)
            setTimeout(() => {
                instance.waitUntilValid((stats) => {
                    expect(stats).have.keys('hasErrors', 'hasWarnings')
                    done()
                })
            })
        })
    })

    describe('invalidate', () => {
        it('should use callback immediately when in lazy mode', (done) => {
            const instance = middleware(compiler, { lazy: true, quiet: true })
            // because we never call plugins.done(), callback either is called immediately or never
            instance.invalidate(done)
        })

        it('should wait for bundle done', (done) => {
            const instance = middleware(compiler, options)
            let doneCalled = false
            instance.invalidate(() => {
                if (doneCalled) {
                    expect(invalidationCount).to.equal(1)
                    done()
                } else {
                    done(new Error('`invalid` called before bundle was done'))
                }
            })

            setTimeout(() => {
                plugins.done(doneStats)
                doneCalled = true
            }, 100)
        })

        it('should work without callback', (done) => {
            const instance = middleware(compiler, options)
            instance.invalidate()
            setTimeout(() => {
                expect(invalidationCount).to.equal(1)
                done()
            }, 100)
        })
    })

    describe('close', () => {
        it('should use callback immediately when in lazy mode', (done) => {
            const instance = middleware(compiler, { lazy: true, quiet: true })
            instance.close(done)
        })

        it('should call close on watcher', (done) => {
            const instance = middleware(compiler, options)
            instance.close(() => {
                expect(closeCount).to.equal(1)
                done()
            })
        })

        it('should call close on watcher without callback', () => {
            const instance = middleware(compiler, options)
            instance.close()
            expect(closeCount).to.equal(1)
        })
    })

    describe('getFilenameFromUrl', () => {
        it('use publicPath and compiler.outputPath to parse the filename', (done) => {
            const instance = middleware(compiler, options)
            const filename = instance.getPathnameFromUrl('/public/index.html')
            expect(filename).to.equal('/output/index.html')
            done()
        })
    })
})
