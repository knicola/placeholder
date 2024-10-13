import { describe, it, expect } from '@jest/globals'
import { optionsFromURL } from '../src/options'
import { URL } from 'url'

describe('optionsFromURL', () => {
    const validBaseURL = 'https://example.com'

    it('should return valid options for a basic SVG URL', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/100x200.svg`),
        )
        expect(error).toBeUndefined()
        expect(options).toMatchObject({
            width: 100,
            height: 200,
            scale: 1,
            format: 'svg',
            backgroundColor: '#dddddd',
            textColor: '#999999',
            text: '100 x 200',
            font: 'Lato',
        })
    })

    it('should handle URLs with a valid scale', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400@2x.png`),
        )
        expect(error).toBeUndefined()
        expect(options).toMatchObject({
            width: 300,
            height: 400,
            scale: 2,
            scaledWidth: 600,
            scaledHeight: 800,
            format: 'png',
        })
    })

    it('should return an error for invalid scale', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400@9x.jpg`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid scale')
    })

    it('should set the default format if none is provided', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/500x500`),
        )
        expect(error).toBeUndefined()
        expect(options?.format).toBe('svg')
    })

    it('should cap width and height to min and max sizes', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/5000x5.svg`),
        )
        expect(error).toBeUndefined()
        expect(options?.width).toBe(4000)
        expect(options?.height).toBe(10)
    })

    it('should return an error for invalid width', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/invalidx100.png`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toContain('Invalid width')
    })

    it('should return an error for invalid height', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/300xinvalid.jpg`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toContain('Invalid height')
    })

    it('should validate background and text colors', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400/000/fff.png`),
        )
        expect(error).toBeUndefined()
        expect(options).toMatchObject({
            backgroundColor: '#000000',
            textColor: '#ffffff',
        })
    })

    it('should return an error for invalid background color', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400/invalid.png`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid background color')
    })

    it('should return an error for invalid text color', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400/000/invalid.png`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid text color')
    })

    it('should parse text and font from query parameters', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400.png?text=Hello&font=lato`),
        )
        expect(error).toBeUndefined()
        expect(options).toMatchObject({
            text: 'Hello',
            font: 'Lato',
        })
    })

    it('should return an error for invalid font size', () => {
        const [, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x400.png?fontsize=invalid`),
        )
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid font size')
    })

    it('should use default values if no parameters are provided', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/200x200`),
        )
        expect(error).toBeUndefined()
        expect(options?.backgroundColor).toBe('#dddddd')
        expect(options?.textColor).toBe('#999999')
        expect(options?.font).toBe('Lato')
    })

    it('should handle URLs with unsupported formats gracefully', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/300x300.bmp`),
        )
        expect(error).toBeUndefined()
        expect(options?.format).toBe('svg')
    })

    it('should return an error for URLs with too many segments', () => {
        const [, error] = optionsFromURL(new URL(`${validBaseURL}/a/b/c/d`))
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid width')
    })

    it('should return an error if no size is provided', () => {
        const [, error] = optionsFromURL(new URL(`${validBaseURL}/.png`))
        expect(error).toBeDefined()
        expect(error?.message).toBe('Invalid URL')
    })

    it('should calculate default font size based on scaled dimensions', () => {
        const [options, error] = optionsFromURL(
            new URL(`${validBaseURL}/100x100@2x`),
        )
        expect(error).toBeUndefined()
        expect(options?.fontsize).toBe(Math.floor(Math.min(200, 200) * 0.1))
    })
})
