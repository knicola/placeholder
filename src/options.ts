import tinycolor from 'tinycolor2'

export const supportedFormats = new Set([
    'svg',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
])

const supportedFonts = new Map([
    ['lato', 'Lato'],
    ['lora', 'Lora'],
    ['opensans', 'OpenSans'],
    ['oswald', 'Oswald'],
    ['playfairdisplay', 'PlayfairDisplay'],
    ['ptsans', 'PTSans'],
    ['raleway', 'Raleway'],
    ['roboto', 'Roboto'],
    ['sourcesans3', 'SourceSans3'],
])

const defaultScale = 1
const defaultFont = 'Lato'
const defaultBackgroundColor = '#dddddd'
const defaultTextColor = '#999999'
const defaultFormat = 'svg'
const minSize = 10
const maxSize = 4000

export interface Options {
    width: number
    height: number
    scale: number
    scaledWidth: number
    scaledHeight: number
    format: string
    backgroundColor: string
    textColor: string
    text: string
    font: string
    fontsize: number
}

export type Ok<T> = [T, undefined]
export type Err<E> = [undefined, E]
export type Result<T, E> = Ok<T> | Err<E>
export function ok<T> (value: T): Ok<T> {
    return [value, undefined]
}
export function err<E> (error: E): Err<E> {
    return [undefined, error]
}

export class OptionsError extends Error {
    public readonly path: string
    public readonly value: any

    constructor (message: string, path: string, value: any) {
        super(message)
        this.name = 'OptionsError'
        this.path = path
        this.value = value
    }
}

export function optionsFromURL (url: URL): Result<Options, Error> {
    const fail = (message: string, value: any): Err<OptionsError> =>
        err(new OptionsError(message, url.pathname, value))

    const opts: Partial<Options> = {}

    const params = url.pathname.split('/').filter((v) => !! v)

    if (params.length === 0 || params.length > 4) { return fail('Invalid number of parameters', params.length) }

    const last = params[params.length - 1]
    if (supportedFormats.has(last)) {
        opts.format = last
        params.pop()
    } else {
        const ext = last.split('.').at(-1)
        if (ext && supportedFormats.has(ext)) {
            opts.format = ext
            params[params.length - 1] = last.slice(0, -ext.length - 1)
        } else {
            opts.format = defaultFormat
        }
    }

    const first = params.shift()
    if (! first) {
        return fail('Invalid URL', first)
    }
    const [size, retina] = first.split('@')
    if (retina) {
        if (retina.at(-1) === 'x') {
            const x = retina.slice(0, -1)
            const r = Number(x)
            if (! Number.isSafeInteger(r) || r < 1 || r > 8) {
                return fail('Invalid scale', retina)
            }
            opts.scale = r
        } else {
            return fail('Invalid scale', retina)
        }
    } else if (first.includes('@')) {
        return fail('Invalid scale', first)
    } else {
        opts.scale = defaultScale
    }
    if (size) {
        const [width, height] = size.split('x').map((s) => parseInt(s, 10))
        if (width) {
            const w = Number(width)
            if (! Number.isSafeInteger(w)) { return fail('Invalid width', width) }
            if (w < minSize) { opts.width = minSize } else if (w > maxSize) { opts.width = maxSize } else { opts.width = w }
            opts.scaledWidth = opts.width * opts.scale
        } else {
            return fail('Invalid width', width)
        }
        if (height) {
            const h = Number(height)
            if (! Number.isSafeInteger(h)) { return fail('Invalid height', height) }
            if (h < minSize) { opts.height = minSize } else if (h > maxSize) { opts.height = maxSize } else { opts.height = h }
            opts.scaledHeight = opts.height * opts.scale
        } else if (size.includes('x')) {
            return fail('Invalid height', height)
        } else {
            opts.height = opts.width
            opts.scaledHeight = opts.scaledWidth
        }
    } else {
        return fail('Invalid size', size)
    }

    const [bg, fg] = params
    if (bg) {
        const color = tinycolor(bg)
        if (! color.isValid()) {
            return fail('Invalid background color', bg)
        }
        opts.backgroundColor = '#' + color.toHex()
        if (! fg) {
            opts.textColor = color.isDark() ? '#ffffff' : '#000000'
        }
    } else {
        opts.backgroundColor = defaultBackgroundColor
        opts.textColor = defaultTextColor
    }
    if (fg) {
        if (! bg) {
            return fail('Text color without background color', fg)
        }
        const color = tinycolor(fg)
        if (! color.isValid()) {
            return fail('Invalid text color', fg)
        }
        opts.textColor = '#' + color.toHex()
    }

    const { searchParams } = url

    const text = searchParams.get('text')
    if (text) {
        opts.text = decodeURIComponent(text)
    } else {
        opts.text = `${opts.width} x ${opts.height}`
    }

    const font = searchParams.get('font')
    if (font) {
        const value = supportedFonts.get(decodeURIComponent(font))
        if (! value) {
            return fail('Invalid font', font)
        }
        opts.font = value
    } else {
        opts.font = defaultFont
    }

    if (searchParams.has('fontsize')) {
        const size = Number(searchParams.get('fontsize'))
        if (! Number.isSafeInteger(size)) {
            return fail('Invalid font size', size)
        }
        opts.fontsize = size
    } else {
        opts.fontsize = Math.floor(
            Math.max(opts.scaledWidth, opts.scaledHeight) * 0.1,
        )
    }

    return ok(opts as Options)
}
