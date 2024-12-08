import TextToSVG from 'text-to-svg'
import sharp from 'sharp'
import { PassThrough, type Readable } from 'node:stream'

export const PlaceHolderFormats = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'] as const

export type ImageFormat = typeof PlaceHolderFormats[number]

export interface PlaceHolderOptions {
    height: number
    width: number
    background: string
    foreground: string
    text: string
    font: string
    fontsize: number
    format: ImageFormat
}

export function placeholder (options: PlaceHolderOptions): Readable | string {
    const svg = generateSVGDocument(options)
    if (options.format === 'svg') {
        return svg
    }
    return convertSVGToImage(svg, options.format)
}

const cachedFonts = new Map<string, TextToSVG>()

// @todo get path from config?
export function loadFonts (fonts: string[]): void {
    for (const name of fonts) {
        const font = TextToSVG.loadSync(`./fonts/${name}-Bold.ttf`)
        cachedFonts.set(name, font)
    }
}

function htmlEscape (input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
        '>': '&gt;',
        '<': '&lt;',
    }
    return input.replace(/[&'"<>]/g, char => map[char])
}

type SVGTextOptions = Pick<PlaceHolderOptions, 'foreground' | 'text' | 'fontsize'>
function generateSVGText (options: SVGTextOptions): string {
    const { foreground, text, fontsize } = options
    return (
        `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${foreground}" font-family="Arial" font-size="${fontsize}">` +
            `${htmlEscape(text)}` +
        '</text>'
    )
}

type SVGPathOptions = Pick<PlaceHolderOptions, 'width' | 'height' | 'foreground' | 'text' | 'font' | 'fontsize'>
function generateSVGPath (options: SVGPathOptions): string | null {
    const { width, height, foreground, text, font, fontsize } = options

    const ttsvg = cachedFonts.get(font)
    if (! ttsvg) {
        return null
    }

    return ttsvg.getPath(text, {
        fontSize: fontsize,
        x: Math.floor(width / 2),
        y: Math.floor(height / 2),
        anchor: 'center middle',
        attributes: { fill: foreground },
    })
}

export type SVGDocumentOptions = Omit<PlaceHolderOptions, 'format'>
export function generateSVGDocument (options: SVGDocumentOptions): string {
    const { width, height, background } = options
    const path = generateSVGPath(options) ?? generateSVGText(options)
    return (
        `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
            `<rect width='100%' height='100%' fill='${background}' />` +
            `${path}` +
        '</svg>'
    )
}

export function convertSVGToImage (svg: string | Buffer, format: ImageFormat): Readable {
    const svgBuffer = Buffer.from(svg)
    const pt = new PassThrough()
    sharp(svgBuffer)
        .toFormat(format as any)
        .pipe(pt)
    return pt
}
