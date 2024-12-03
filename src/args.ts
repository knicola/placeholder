import { parseArgs } from 'util'
import { z } from 'zod'

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
    // eslint-disable-next-line no-console
    console.error(
        'Invalid argument',
        JSON.stringify(error.flatten().fieldErrors, null, 2),
    )
    process.exit(1)
}

export const args: Args = data
