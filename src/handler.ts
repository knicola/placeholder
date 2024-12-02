/* eslint-disable no-console */
import { Readable } from 'stream'
import http from 'http'
import { config } from '@/config'
import {
    loadFonts,
    parseURL,
    generateSVGDocument,
    convertSVGToImage,
} from '@/placeholder'

// Utility function to send responses
function write (
    res: http.ServerResponse,
    body: string | Buffer | Readable,
    code = 200,
    contentType = 'text/plain',
): void {
    res.writeHead(code, { 'Content-Type': contentType })
    if (body instanceof Readable) {
        body.pipe(res)
    } else {
        res.end(body)
    }
}

// Preload fonts
loadFonts(config.fonts.values() as any)

// The main request handler
export function requestHandler (req: http.IncomingMessage, res: http.ServerResponse): void {
    if (req.method !== 'GET') {
        return write(res, 'Method Not Allowed', 405)
    }

    if (! req.url || req.url === '/') {
        return write(res, 'OK')
    }

    if (req.url === '/favicon.ico') {
        return write(res, 'No favicon', 404)
    }

    const options = parseURL(req.url)
    if (! options) {
        return write(res, 'Invalid URL', 400)
    }

    const svg = generateSVGDocument(options)
    const { format } = options

    if (format === 'svg') {
        res.writeHead(200, {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=31536000, immutable',
        })
        res.end(svg)
        return
    }

    convertSVGToImage(svg, format as any)
        .on('data', () => {
            if (! res.headersSent) {
                res.writeHead(200, {
                    'Content-Type': `image/${format}`,
                    'Transfer-Encoding': 'chunked',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                })
            }
        })
        .on('error', (err) => {
            console.error('Error rendering image', { err, options })
            if (! res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' })
                res.end('Internal Server Error')
            }
        })
        .pipe(res)
}
