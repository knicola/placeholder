/* eslint-disable no-console */
import http from 'http'
import { Readable } from 'stream'
import { parseURL } from './parser'
import { config } from './config'
import { generateSVGDocument, loadFonts, convertSVGToImage } from './placeholder'
import type { AddressInfo } from 'net'

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

// preload fonts
loadFonts(config.fonts.values() as any)

const server = http.createServer((req, res) => {
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
        return res.end(svg)
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
})

server.listen(config.port, config.host, () => {
    const { address, port } = server.address() as AddressInfo
    console.log(`Server running at http://${address}:${port}`)
})
