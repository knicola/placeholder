import { describe, it, expect } from 'vitest'
import { parseURL } from '@/placeholder/parser'

const options = {
    colors: new Map([
        ['red', '#ff0000'],
        ['green', '#00ff00'],
        ['blue', '#0000ff'],
    ]),
    formats: new Set(['png', 'jpg']),
    fonts: new Map([
        ['arial', 'Arial'],
        ['verdana', 'Verdana'],
    ]),
    defaultFormat: 'svg',
    defaultBackground: '#ffffff',
    defaultForeground: '#000000',
    defaultScale: 1,
    minScale: 0.5,
    maxScale: 2,
    minSize: 10,
    maxSize: 1000,
    defaultFont: 'Arial',
}

describe('parseURL', () => {
    describe('size', () => {
        it('should return null if width is undefined', () => {
            const url = 'x200'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })

        it('should return null if height is undefined', () => {
            const url = '200x'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })

        it('should use width as default height if no height is provided', () => {
            const url = '300'
            const result = parseURL(url, options)
            expect(result?.realHeight).toBe(300)
        })

        it('should clamp width to max size if it exceeds the limit', () => {
            const url = '2000'
            const result = parseURL(url, options)
            expect(result?.realWidth).toBe(options.maxSize)
        })

        it('should clamp height to max size if it exceeds the limit', () => {
            const url = '300x2000'
            const result = parseURL(url, options)
            expect(result?.realHeight).toBe(options.maxSize)
        })

        it('should clamp width to min size if it is smaller than the limit', () => {
            const url = '5'
            const result = parseURL(url, options)
            expect(result?.realWidth).toBe(options.minSize)
        })

        it('should clamp height to min size if it is smaller than the limit', () => {
            const url = '300x5'
            const result = parseURL(url, options)
            expect(result?.realHeight).toBe(options.minSize)
        })
    })

    describe('colors', () => {
        it('should use default background color if none is provided', () => {
            const url = '300x200'
            const result = parseURL(url, options)
            expect(result?.background).toBe(options.defaultBackground)
        })

        it('should use contrast color for foreground if none is provided', () => {
            const url = '300x200/red'
            const result = parseURL(url, options)
            expect(result?.foreground).toBe('#ffffff')
        })

        it('should use default values for invalid hex values in background or foreground', () => {
            const url = '300x200/#ggg'
            const result = parseURL(url, options)
            expect(result?.background).toBe(options.defaultBackground)
            expect(result?.foreground).toBe(options.defaultForeground)
        })

        it('should complete 3-char hex colors for background or foreground', () => {
            const url = '300x200/abc/def'
            const result = parseURL(url, options)
            expect(result?.background).toBe('#aabbcc')
            expect(result?.foreground).toBe('#ddeeff')
        })

        it('should convert color names to hex for background or foreground', () => {
            const url = '300x200/red/blue'
            const result = parseURL(url, options)
            expect(result?.background).toBe('#ff0000')
            expect(result?.foreground).toBe('#0000ff')
        })
    })

    describe('retina', () => {
        it('should adjust size if scale is provided', () => {
            const url = '300x200@2x'
            const result = parseURL(url, options)
            expect(result?.width).toBe(600)
            expect(result?.height).toBe(400)
        })

        it('should clamp scale to max if it exceeds the limit', () => {
            const url = '300x200@3x'
            const result = parseURL(url, options)
            expect(result?.scale).toBe(options.maxScale)
        })

        it('should return null for scale below 1', () => {
            const url = '300x200@0.5x'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })

        it('should return null for invalid scale value', () => {
            const url = '300x200@invalidx'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })

        it('should clamp width to max size after scale is applied', () => {
            const url = '600x400@2x'
            const result = parseURL(url, options)
            expect(result?.width).toBe(options.maxSize)
        })

        it('should clamp height to max size after scale is applied', () => {
            const url = '400x600@2x'
            const result = parseURL(url, options)
            expect(result?.height).toBe(options.maxSize)
        })
    })

    describe('format', () => {
        it('should default to svg if no format is provided', () => {
            const url = '300x200'
            const result = parseURL(url, options)
            expect(result?.format).toBe('svg')
        })

        it('should allow format to be specified as .png', () => {
            const url = '300x200.png'
            const result = parseURL(url, options)
            expect(result?.format).toBe('png')
        })

        it('should allow format to be specified as /png', () => {
            const url = '300x200/red/blue/png'
            const result = parseURL(url, options)
            expect(result?.format).toBe('png')
        })

        it('should return null if format is not last', () => {
            const url = '300x200/png/red'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })

        it('should return null for invalid format', () => {
            const url = '300x200.invalid'
            const result = parseURL(url, options)
            expect(result).toBeNull()
        })
    })

    describe('query params', () => {
        it('should parse font from query string', () => {
            const url = '300x200?font=verdana'
            const result = parseURL(url, options)
            expect(result?.font).toBe('verdana')
        })

        it('should parse fontsize from query string', () => {
            const url = '300x200?fontsize=24'
            const result = parseURL(url, options)
            expect(result?.fontsize).toBe(24)
        })

        it('should parse text from query string', () => {
            const url = '300x200?text=Hello%20World'
            const result = parseURL(url, options)
            expect(result?.text).toBe('Hello World')
        })

        it('should return default font if query string font is invalid', () => {
            const url = '300x200?font=invalidfont'
            const result = parseURL(url, options)
            expect(result?.font).toBe(options.defaultFont)
        })

        it('should return default fontsize if query string fontsize is invalid', () => {
            const url = '300x200?fontsize=invalidsize'
            const result = parseURL(url, options)
            expect(result?.fontsize).toBe(Math.floor(Math.max(result?.width ?? 0, result?.height ?? 0) * 0.1))
        })

        it('should decode and parse special characters in text', () => {
            const url = '300x200?text=Special%20Characters%20%26%20Symbols%20%40%23'
            const result = parseURL(url, options)
            expect(result?.text).toBe('Special Characters & Symbols @#')
        })
    })
})
