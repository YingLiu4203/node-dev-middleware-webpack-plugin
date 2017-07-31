import * as express from 'express'
import * as mime from 'mime'
import * as parseRange from 'range-parser'

import { IConfiguration, IReporterConfig } from './middleware_types'

function handleRangeHeaders(
    content: any, req: express.Request, res: express.Response) {
    // assumes express API
    res.setHeader('Accept-Ranges', 'bytes')
    if (req.headers.range) {
        // TODO the req.headers.range migth be string[]
        const ranges = parseRange(content.length,
            req.headers.range as string)

        // unsatisfiable
        if (parseRange.Result.unsatisifiable === ranges) {
            res.setHeader('Content-Range', 'bytes */' + content.length)
            res.statusCode = 416    // range not satisfiable
        }

        // syntactically invalid and multiple ranges
        // are treated as a regular response)
        if (parseRange.Result.unsatisifiable !== ranges) {
            const parsedRanges = ranges as parseRange.Ranges
            const start = parsedRanges[0].start
            const end = parsedRanges[0].end
            if (parsedRanges.length === 1) {
                // Content-Range
                res.statusCode = 206 // partial content
                const length = content.length
                res.setHeader(
                    'Content-Range',
                    'bytes ' + start + '-' + end + '/' + length,
                )
                content = content.slice(start, end + 1)
            }
        }
    }
    return content
}

export default function sendContent(
    filename: string,
    fileSystem: any,
    req: express.Request,
    res: express.Response,
    headers?: { [key: string]: string },
) {
    let content = fileSystem.readFileSync(filename)
    content = handleRangeHeaders(content, req, res)
    res.setHeader("Content-Type", mime.lookup(filename) + "; charset=UTF-8")
    res.setHeader("Content-Length", content.length)
    if (headers) {
        for (const name in headers) {
            if (headers.hasOwnProperty(name)) {
                res.setHeader(name, headers[name])
            }
        }
    }

    res.send(content)
}
