import type { ImageFormat } from './placeholder'

export interface ParserOptions {
    colors: Map<string, string>
    formats: Set<string>
    fonts: Map<string, string>
    defaultFormat: string
    defaultBackground: string
    defaultForeground: string
    defaultScale: number
    minScale: number
    maxScale: number
    minSize: number
    maxSize: number
    defaultFont: string
}

const isHexColor = (hex: string): boolean => /^#?[0-9a-f]{3,6}$/i.test(hex)

const formatHexColor = (hex: string): string => {
    hex = hex.replace('#', '')
    if (hex.length === 3) {
        hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
    }
    return `#${hex}`
}

export function parseColor (color: string, options: Pick<ParserOptions, 'colors'>): string | null {
    if (isHexColor(color)) {
        return formatHexColor(color)
    }

    const hex = options.colors.get(color)
    if (hex) {
        return formatHexColor(hex)
    }

    return null
}

export interface ParsedPath {
    width: number
    height?: number
    scale?: number
    format?: string
    background?: string
    foreground?: string
}

export function parsePath (path: string, options: ParserOptions): ParsedPath | null {
    // remove leading slash
    if (path[0] === '/') {
        path = path.slice(1)
    }
    // remove trailing slash
    if (path[path.length - 1] === '/') {
        path = path.slice(0, -1)
    }

    let i = 0
    const res: ParsedPath = {} as any

    function extractNumber (): number | null {
        let num = ''
        if (path[i] === '0') {
            return null
        }
        while (i < path.length && /\d/.test(path[i])) {
            num += path[i++]
        }
        return num ? parseInt(num, 10) : null
    }

    function extractAlphanumeric (): string | null {
        let str = ''
        while (i < path.length && /[a-zA-Z0-9]/.test(path[i])) {
            str += path[i++]
        }
        return str || null
    }

    // read required width
    const width = extractNumber()
    if (width === null) {
        return null
    }
    res.width = width

    // read optional height
    if (path[i] === 'x') {
        i++ // skip 'x'
        const height = extractNumber()
        if (height !== null) {
            res.height = height
        } else {
            i-- // rewind
        }
    }

    // read optional scale
    if (path[i] === '@') {
        i++ // skip '@'
        const scale = extractNumber()
        if (scale !== null && path[i] === 'x') {
            res.scale = scale
            i++ // skip 'x'
        } else {
            i-- // rewind
        }
    }

    // read optional background color
    if (path[i] === '/') {
        i++ // skip '/'
        const bg = extractAlphanumeric()
        if (bg !== null) {
            if (i === path.length && options.formats.has(bg)) {
                res.format = bg
            } else {
                const color = parseColor(bg, options)
                if (color) {
                    res.background = color
                } else {
                    return null
                }
            }
        } else {
            i-- // rewind
        }
    }

    // read optional foreground color
    if (path[i] === '/') {
        i++ // skip '/'
        const fg = extractAlphanumeric()
        if (fg !== null) {
            if (i === path.length && options.formats.has(fg)) {
                res.format = fg
            } else {
                const color = parseColor(fg, options)
                if (color) {
                    res.foreground = color
                } else {
                    return null
                }
            }
        } else {
            i-- // rewind
        }
    }

    // read optional format
    if (path[i] === '.') {
        i++ // skip '.'
        const format = extractAlphanumeric()
        if (format !== null && options.formats.has(format)) {
            res.format = format
        } else {
            i-- // rewind
        }
    } else if (path[i] === '/') {
        i++ // skip '/'
        const format = extractAlphanumeric()
        if (format !== null) {
            res.format = format
        } else {
            i-- // rewind
        }
    }

    // end of string
    if (i !== path.length) {
        return null
    }

    return res
}

export interface ParsedQuery {
    font?: string
    fontsize?: number
    text?: string
}

export function parseQuery (query: string, options: Pick<ParserOptions, 'fonts'>): ParsedQuery {
    const q = new URLSearchParams(query)

    const res: ParsedQuery = {}

    // read optional font
    const font = q.get('font')
    if (font !== null && options.fonts.has(font)) {
        res.font = font
    }

    // read optional font size
    const fontsize = q.get('fontsize')
    if (fontsize !== null) {
        const size = parseInt(fontsize, 10)
        if (! isNaN(size)) {
            res.fontsize = size
        }
    }

    // read optional text
    const text = q.get('text')
    if (text !== null) {
        res.text = decodeURIComponent(text)
    }

    return res
}

const clamp = (value: number, min: number, max: number): number => Math.max(Math.min(max, value), min)

const createURLObj = (url: string, base?: string | URL): URL | null => {
    try {
        return new URL(url, base)
    } catch {
        return null
    }
}

// https://www.w3.org/TR/AERT/#color-contrast
const getContrastColor = (hex: string): string => {
    hex = hex.replace('#', '')
    const rgb = [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
    ]
    return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 >= 128 ? '#000000' : '#ffffff'
}

export interface ParsedURL {
    format: ImageFormat
    background: string
    foreground: string
    realWidth: number
    realHeight: number
    width: number
    height: number
    scale: number
    text: string
    font: string
    fontsize: number
}

export function parseURL (url: string, options: ParserOptions): ParsedURL | null {
    const urlObj = createURLObj(url, 'http://itdontmatter')
    if (! urlObj) {
        return null
    }
    const path = parsePath(urlObj.pathname, options)
    if (! path) {
        return null
    }

    const format = (path.format ?? options.defaultFormat) as ImageFormat
    const background = path.background ?? options.defaultBackground
    const foreground = path.foreground ?? (! path.background ? options.defaultForeground : getContrastColor(path.background))
    const scale = clamp(path.scale ?? options.defaultScale, options.minScale, options.maxScale)
    const realWidth = clamp(path.width, options.minSize, options.maxSize)
    const realHeight = clamp(path.height ?? path.width, options.minSize, options.maxSize)
    const width = Math.min(realWidth * scale, options.maxSize)
    const height = Math.min(realHeight * scale, options.maxSize)

    const query = parseQuery(urlObj.search, options)
    const text = query.text ?? `${realWidth} x ${realHeight}`
    const font = query.font ?? options.defaultFont
    const fontsize = query.fontsize ?? Math.floor(Math.max(width, height) * 0.1)

    return {
        format,
        background,
        foreground,
        realWidth,
        realHeight,
        width,
        height,
        scale,
        text,
        font,
        fontsize,
    }
}
