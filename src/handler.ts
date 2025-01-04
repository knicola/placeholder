import { Readable } from 'node:stream'
import http from 'node:http'
import { config } from '@/config'
import {
    loadFonts,
    parseURL,
    generateSVGDocument,
    convertSVGToImage,
} from '@/placeholder'
import { logger } from '@/logger'
import { createRateLimiter } from '@/ratelimiter'

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

loadFonts(config.fonts, config.fontsDir)

const mimeTypes = {
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
}

function getCacheControl (): string {
    return config.cacheTTL ? `public, max-age=${config.cacheTTL}, immutable` : 'no-cache'
}

const ratelimit = createRateLimiter({
    capacity: config.rateLimitMaxRequests,
    interval: config.rateLimitWindowMs,
    maxStoreSize: 10_000,
})

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

    if (! req.socket.remoteAddress) {
        return
    }

    const { exceeded, remaining, timestamp } = ratelimit.check(req.socket.remoteAddress)

    const ratelimitHeaders = {
        'RateLimit-Remaining': remaining,
        'RateLimit-Limit': config.rateLimitMaxRequests,
    }

    if (exceeded) {
        res.writeHead(429, {
            'Content-Type': 'text/plain',
            ...ratelimitHeaders,
            'RateLimit-Reset': Math.ceil((timestamp + config.rateLimitWindowMs) / 1000),
            'Retry-After': Math.ceil(config.rateLimitWindowMs / 1000),
        })
        res.end('Rate limit exceeded')
        return
    }

    const options = parseURL(req.url, config)
    if (! options) {
        return write(res, 'Invalid URL', 400)
    }

    const svg = generateSVGDocument(options)
    const { format } = options

    if (format === 'svg') {
        res.writeHead(200, {
            'Content-Type': mimeTypes.svg,
            'Cache-Control': getCacheControl(),
            ...ratelimitHeaders,
        })
        res.end(svg)
        return
    }

    convertSVGToImage(svg, format as any)
        .once('data', () => {
            if (! res.headersSent) {
                res.writeHead(200, {
                    'Content-Type': mimeTypes[format],
                    'Transfer-Encoding': 'chunked',
                    'Cache-Control': getCacheControl(),
                    ...ratelimitHeaders,
                })
            }
        })
        .on('error', (err) => {
            logger.error('Error rendering image', { err, options })
            if (! res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' })
                res.end('Internal Server Error')
            }
        })
        .pipe(res)
}
