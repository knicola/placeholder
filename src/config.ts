import YAML from 'yaml'
import { existsSync, readFileSync } from 'node:fs'
import { args } from '@/args'
import { z } from 'zod'
import { PlaceHolderFormats } from '@/placeholder'
import { logger } from '@/logger'
import { resolve } from 'node:path'

const defaults = {
    host: '0.0.0.0',
    port: 3000,
    defaultScale: 1,
    defaultFont: 'lato',
    defaultBackground: '#dddddd',
    defaultForeground: '#999999',
    defaultFormat: 'svg',
    minSize: 10,
    maxSize: 4000,
    minScale: 1,
    maxScale: 3,
    formats: new Set<string>(PlaceHolderFormats),
    fontsDir: './fonts',
    fonts: new Map<string, string>(Object.entries({
        lato: 'Lato-Bold.ttf',
        lora: 'Lora-Bold.ttf',
        montserrat: 'Montserrat-Bold.ttf',
        'open-sans': 'OpenSans-Bold.ttf',
        oswald: 'Oswald-Bold.ttf',
        'playfair-display': 'PlayfairDisplay-Bold.ttf',
        'pt-sans': 'PTSans-Bold.ttf',
        raleway: 'Raleway-Bold.ttf',
        roboto: 'Roboto-Bold.ttf',
        'source-sans-3': 'SourceSans3-Bold.ttf',
    })),
    // https://www.w3.org/TR/css-color-4/#named-colors
    colors: new Map<string, string>(Object.entries({
        aliceblue: 'f0f8ff',
        antiquewhite: 'faebd7',
        aqua: '0ff',
        aquamarine: '7fffd4',
        azure: 'f0ffff',
        beige: 'f5f5dc',
        bisque: 'ffe4c4',
        black: '000',
        blanchedalmond: 'ffebcd',
        blue: '00f',
        blueviolet: '8a2be2',
        brown: 'a52a2a',
        burlywood: 'deb887',
        burntsienna: 'ea7e5d',
        cadetblue: '5f9ea0',
        chartreuse: '7fff00',
        chocolate: 'd2691e',
        coral: 'ff7f50',
        cornflowerblue: '6495ed',
        cornsilk: 'fff8dc',
        crimson: 'dc143c',
        cyan: '0ff',
        darkblue: '00008b',
        darkcyan: '008b8b',
        darkgoldenrod: 'b8860b',
        darkgray: 'a9a9a9',
        darkgreen: '006400',
        darkgrey: 'a9a9a9',
        darkkhaki: 'bdb76b',
        darkmagenta: '8b008b',
        darkolivegreen: '556b2f',
        darkorange: 'ff8c00',
        darkorchid: '9932cc',
        darkred: '8b0000',
        darksalmon: 'e9967a',
        darkseagreen: '8fbc8f',
        darkslateblue: '483d8b',
        darkslategray: '2f4f4f',
        darkslategrey: '2f4f4f',
        darkturquoise: '00ced1',
        darkviolet: '9400d3',
        deeppink: 'ff1493',
        deepskyblue: '00bfff',
        dimgray: '696969',
        dimgrey: '696969',
        dodgerblue: '1e90ff',
        firebrick: 'b22222',
        floralwhite: 'fffaf0',
        forestgreen: '228b22',
        fuchsia: 'f0f',
        gainsboro: 'dcdcdc',
        ghostwhite: 'f8f8ff',
        gold: 'ffd700',
        goldenrod: 'daa520',
        gray: '808080',
        green: '008000',
        greenyellow: 'adff2f',
        grey: '808080',
        honeydew: 'f0fff0',
        hotpink: 'ff69b4',
        indianred: 'cd5c5c',
        indigo: '4b0082',
        ivory: 'fffff0',
        khaki: 'f0e68c',
        lavender: 'e6e6fa',
        lavenderblush: 'fff0f5',
        lawngreen: '7cfc00',
        lemonchiffon: 'fffacd',
        lightblue: 'add8e6',
        lightcoral: 'f08080',
        lightcyan: 'e0ffff',
        lightgoldenrodyellow: 'fafad2',
        lightgray: 'd3d3d3',
        lightgreen: '90ee90',
        lightgrey: 'd3d3d3',
        lightpink: 'ffb6c1',
        lightsalmon: 'ffa07a',
        lightseagreen: '20b2aa',
        lightskyblue: '87cefa',
        lightslategray: '789',
        lightslategrey: '789',
        lightsteelblue: 'b0c4de',
        lightyellow: 'ffffe0',
        lime: '0f0',
        limegreen: '32cd32',
        linen: 'faf0e6',
        magenta: 'f0f',
        maroon: '800000',
        mediumaquamarine: '66cdaa',
        mediumblue: '0000cd',
        mediumorchid: 'ba55d3',
        mediumpurple: '9370db',
        mediumseagreen: '3cb371',
        mediumslateblue: '7b68ee',
        mediumspringgreen: '00fa9a',
        mediumturquoise: '48d1cc',
        mediumvioletred: 'c71585',
        midnightblue: '191970',
        mintcream: 'f5fffa',
        mistyrose: 'ffe4e1',
        moccasin: 'ffe4b5',
        navajowhite: 'ffdead',
        navy: '000080',
        oldlace: 'fdf5e6',
        olive: '808000',
        olivedrab: '6b8e23',
        orange: 'ffa500',
        orangered: 'ff4500',
        orchid: 'da70d6',
        palegoldenrod: 'eee8aa',
        palegreen: '98fb98',
        paleturquoise: 'afeeee',
        palevioletred: 'db7093',
        papayawhip: 'ffefd5',
        peachpuff: 'ffdab9',
        peru: 'cd853f',
        pink: 'ffc0cb',
        plum: 'dda0dd',
        powderblue: 'b0e0e6',
        purple: '800080',
        rebeccapurple: '663399',
        red: 'f00',
        rosybrown: 'bc8f8f',
        royalblue: '4169e1',
        saddlebrown: '8b4513',
        salmon: 'fa8072',
        sandybrown: 'f4a460',
        seagreen: '2e8b57',
        seashell: 'fff5ee',
        sienna: 'a0522d',
        silver: 'c0c0c0',
        skyblue: '87ceeb',
        slateblue: '6a5acd',
        slategray: '708090',
        slategrey: '708090',
        snow: 'fffafa',
        springgreen: '00ff7f',
        steelblue: '4682b4',
        tan: 'd2b48c',
        teal: '008080',
        thistle: 'd8bfd8',
        tomato: 'ff6347',
        turquoise: '40e0d0',
        violet: 'ee82ee',
        wheat: 'f5deb3',
        white: 'fff',
        whitesmoke: 'f5f5f5',
        yellow: 'ff0',
        yellowgreen: '9acd32',
    })),
}

export const ConfigSchema = z.object({
    host: z.string().optional(),
    port: z.number().int().min(0).max(65535).optional(),
    defaultBackground: z.union([
        z.string().regex(/^#?[0-9a-f]{3,6}$/i, 'Invalid color'),
        z.string().refine((value) => defaults.colors.has(value)),
    ]).optional(),
    defaultForeground: z.union([
        z.string().regex(/^#?[0-9a-f]{3,6}$/i, 'Invalid color'),
        z.string().refine((value) => defaults.colors.has(value)),
    ]).optional(),
    defaultFormat: z.enum(PlaceHolderFormats).optional(),
    minSize: z.number().int().positive().optional(),
    maxSize: z.number().int().positive().optional(),
    minScale: z.number().min(1).optional(),
    maxScale: z.number().min(1).optional(),
    defaultScale: z.number().min(1).optional(),
    fontsDir: z.string().refine((value) => existsSync(value), 'Directory does not exist').optional(),
    fonts: z.record(z.string(), z.string()).transform((o) => new Map(Object.entries(o))).optional(),
    defaultFont: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.defaultFont && ! data.fonts?.has(data.defaultFont)) {
        ctx.addIssue({
            path: ['defaultFont'],
            code: z.ZodIssueCode.custom,
            message: `Font '${data.defaultFont}' is not defined in the 'fonts' option`,
        })
    }

    for (const [font, file] of data.fonts || []) {
        const path = data.fontsDir ? resolve(data.fontsDir, file) : resolve(file)
        if (! existsSync(path)) {
            ctx.addIssue({
                path: ['fonts', 'fontsDir'],
                code: z.ZodIssueCode.custom,
                message: `Font '${font}' file '${path}' does not exist`,
            })
        }
    }
})

type Config = z.infer<typeof ConfigSchema>

const parsers: Record<string, (data: any) => any> = {
    json: JSON.parse,
    yml: YAML.parse,
}

export function load (file: string): Config {
    const content = readFileSync(file, 'utf-8')
    let parsed: unknown
    for (const parse of Object.values(parsers)) {
        try {
            parsed = parse(content)
            break
        } catch { /* ignore */ }
    }

    if (typeof parsed !== 'object') {
        logger.error('Invalid config file format', { file })
        process.exit(1)
    }

    const { data, error } = ConfigSchema.safeParse(parsed)
    if (error) {
        logger.error(
            'Invalid config file options',
            JSON.stringify(error.flatten().fieldErrors, null, 2),
        )
        process.exit(1)
    }

    return data
}

export const config = defaults

if (args.config) {
    const data = load(args.config)

    Object.assign(config, data)
}

if (args.host) {
    Object.assign(config, { host: args.host })
}

if (args.port) {
    Object.assign(config, { port: args.port })
}
