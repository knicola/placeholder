import { parseArgs } from 'node:util'
import { z } from 'zod'
import { logger } from './logger'

const input = parseArgs({
    strict: false,
    options: {
        config: {
            type: 'string',
            short: 'c',
        },
        host: {
            type: 'string',
            short: 'h',
        },
        port: {
            type: 'string',
            short: 'p',
        },
    },
})

const ArgsSchema = z.object({
    config: z.string().optional(),
    host: z.string().optional(),
    port: z.coerce.number().optional(),
})

type Args = z.infer<typeof ArgsSchema>

const { data, error } = ArgsSchema.safeParse(input.values)

if (error) {
    logger.error(
        'Invalid argument',
        JSON.stringify(error.flatten().fieldErrors, null, 2),
    )
    process.exit(1)
}

export const args: Args = data
