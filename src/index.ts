/* eslint-disable no-console */
import http from 'http'
import sharp from 'sharp'
import TextToSVG from 'text-to-svg'
import { optionsFromURL } from './options'

function tryParseUrl (url: string, base?: string | URL): URL | undefined {
    try { return new URL(url, base) } catch {}
}

function write (
    res: http.ServerResponse,
    message: string | Buffer,
    code = 200,
    contentType = 'text/plain',
): void {
    res.writeHead(code, { 'Content-Type': contentType })
    res.end(message)
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

    const urlObj = tryParseUrl(req.url, 'http://itdoesntmatter')
    if (! urlObj) {
        return write(res, 'Invalid URL', 400)
    }
    const [options, err] = optionsFromURL(urlObj)
    if (err) {
        console.error(err)
        return write(res, err.message, 400)
    }
    const {
        scaledWidth,
        scaledHeight,
        backgroundColor,
        textColor,
        text,
        font,
        fontsize,
        format,
    } = options

    const ttsvg = TextToSVG.loadSync(`./fonts/${font}-Bold.ttf`)
    const path = ttsvg.getPath(text, {
        fontSize: fontsize,
        x: Math.floor(scaledWidth / 2),
        y: Math.floor(scaledHeight / 2),
        anchor: 'center middle',
        attributes: { fill: textColor },
    })

    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${scaledWidth}' height='${scaledHeight}' viewBox='0 0 ${scaledWidth} ${scaledHeight}'>` +
          `<rect width='100%' height='100%' fill='${backgroundColor}' />` +
          `${path}` +
        '</svg>'

    if (format === 'svg') {
        return write(res, svg, 200, 'image/svg+xml')
    }

    sharp(Buffer.from(svg))
        .toFormat(format as any)
        .toBuffer((err, buffer) => {
            if (err) {
                console.error(err, options)
                return write(res, 'Internal Server Error', 500)
            }
            write(res, buffer, 200, `image/${format}`)
        })
})

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000')
})
