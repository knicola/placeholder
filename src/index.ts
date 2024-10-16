/* eslint-disable no-console */
import http from 'http'
import sharp from 'sharp'
import TextToSVG from 'text-to-svg'
import { Readable } from 'stream'
import { parseURL } from './parser'
import { config } from './config'

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
const cachedFonts = new Map<string, TextToSVG>()
for (const name of config.fonts.values()) {
    try {
        const font = TextToSVG.loadSync(`./fonts/${name}-Bold.ttf`)
        cachedFonts.set(name, font)
    } catch (err) {
        console.error(`Failed to load font: ${name}`, err)
    }
}

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
    const { width, height, background, foreground, text, font, fontsize, format } = options

    const ttsvg = cachedFonts.get(font)
    if (! ttsvg) {
        console.error(`Font not found: ${font}`)
        return write(res, 'Internal Server Error', 500)
    }
    const path = ttsvg.getPath(text, {
        fontSize: fontsize,
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
        anchor: 'center middle',
        attributes: { fill: foreground },
    })

    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
          `<rect width='100%' height='100%' fill='${background}' />` +
          `${path}` +
        '</svg>'

    if (format === 'svg') {
        return write(res, svg, 200, 'image/svg+xml')
    }

    const svgBuffer = Buffer.from(svg)

    res.writeHead(200, {
        'Content-Type': `image/${format}`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'public, max-age=31536000, immutable',
    })
    sharp(svgBuffer)
        .toFormat(format as any)
        .on('error', (err) => {
            console.error(err, options)
            write(res, 'Internal Server Error', 500)
        })
        .pipe(res)
})

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000')
})
