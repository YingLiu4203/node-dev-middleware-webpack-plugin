import { expect } from 'chai'
import 'mocha'

import getPathnameFromUrl from '../lib/get_pathname_from_Url'

function testUrl(options: any) {
    const pathname = getPathnameFromUrl(options.publicPath, options, options.url)
    expect(pathname).eq(options.expected)
}

describe('GetFilenameFromUrl', () => {
    it('should handle urls', () => {
        const results = [
            {
                url: '/foo.js',
                outputPath: '/',
                publicPath: '/',
                expected: '/foo.js',
            }, {
                url: '/f%C3%B6%C3%B6.js', // Express encodes the URI component, so we do the same
                outputPath: '/',
                publicPath: '/',
                expected: '/föö.js',
            }, {
                url: '/%foo%/%foo%.js', // Filenames can contain characters not allowed in URIs
                outputPath: '/',
                publicPath: '/',
                expected: '/%foo%/%foo%.js',
            }, {
                url: '/0.19dc5d417382d73dd190.hot-update.js',
                outputPath: '/',
                publicPath: 'http://localhost:8080/',
                expected: '/0.19dc5d417382d73dd190.hot-update.js',
            }, {
                url: '/bar.js',
                outputPath: '/',
                publicPath: 'https://localhost:8080/',
                expected: '/bar.js',
            }, {
                url: '/test.html?foo=bar',
                outputPath: '/',
                publicPath: '/',
                expected: '/test.html',
            }, {
                url: '/a.js',
                outputPath: '/dist',
                publicPath: '/',
                expected: '/dist/a.js',
            }, {
                url: '/b.js',
                outputPath: '/',
                publicPath: undefined,
                expected: '/b.js',
            }, {
                url: '/c.js',
                outputPath: undefined,
                publicPath: undefined,
                expected: '/c.js',
            }, {
                url: '/more/complex/path.js',
                outputPath: '/a',
                publicPath: '/',
                expected: '/a/more/complex/path.js',
            }, {
                url: '/more/complex/path.js',
                outputPath: '/a',
                publicPath: '/complex',
                expected: '',
            }, {
                url: 'c.js',
                outputPath: '/dist',
                publicPath: '/',
                expected: '', // publicPath is not in url, so it should fail
            }, {
                url: '/bar/',
                outputPath: '/foo',
                publicPath: '/bar/',
                expected: '/foo',
            }, {
                url: '/bar/',
                outputPath: '/',
                publicPath: 'http://localhost/foo/',
                expected: '',
            }, {
                url: 'http://test.domain/test/sample.js',
                outputPath: '/',
                publicPath: '/test/',
                expected: '/sample.js',
            }, {
                url: 'http://test.domain/test/sample.js',
                outputPath: '/',
                publicPath: 'http://other.domain/test/',
                expected: '',
            }, {
                url: '/protocol/relative/sample.js',
                outputPath: '/',
                publicPath: '//test.domain/protocol/relative/',
                expected: '/sample.js',
            }, {
                url: '/pathname%20with%20spaces.js',
                outputPath: '/',
                publicPath: '/',
                expected: '/pathname with spaces.js',
            }, {
                url: '/js/sample.js',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/',
                expected: '/foo/sample.js',
            }, {
                url: '/css/sample.css',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/',
                expected: '/bar/sample.css',
            }, {
                url: '/other/sample.txt',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/',
                expected: '/root/other/sample.txt',
            }, {
                url: '/js/sample.js',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/test/',
                expected: '/foo/sample.js',
            }, {
                url: '/css/sample.css',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/test/',
                expected: '/bar/sample.css',
            }, {
                url: '/other/sample.txt',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/test/',
                expected: '',
            }, {
                url: '/test/sample.txt',
                compilers: [
                    { outputPath: '/foo', options: { output: { publicPath: '/js/' } } },
                    { outputPath: '/bar', options: { output: { publicPath: '/css/' } } }
                ],
                outputPath: '/root',
                publicPath: '/test/',
                expected: '/root/sample.txt',
            },
        ]
        results.forEach(testUrl)
    })
})
