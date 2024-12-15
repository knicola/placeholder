import http from 'node:http'
import { AddressInfo } from 'node:net'
import { requestHandler } from '@/handler'
import { config } from '@/config'
import { asyncExitHook, gracefulExit } from 'exit-hook'
import { logger } from '@/logger'

const server = http.createServer(requestHandler)

asyncExitHook(
    async (signal) => {
        if (! server.listening) {
            return
        }
        logger.info(`Received ${signal}, shutting down gracefully...`)
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve(null)))
        })
    },
    { wait: 500 },
)

const errorMessages: { [key: string]: string } = {
    EADDRINUSE: `Port ${config.port} is already in use. Make sure no other server is running on this port.`,
    EADDRNOTAVAIL: `Address ${config.host}:${config.port} is not available. Verify the host configuration.`,
    ECONNREFUSED: 'Connection refused. Ensure the server can establish necessary connections.',
    EACCES: `Permission denied. You may need elevated privileges to bind to port ${config.port}.`,
    ENOTFOUND: `Hostname '${config.host}' could not be resolved. Check your host configuration and DNS settings.`,
}

server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code && errorMessages[err.code]) {
        logger.error(errorMessages[err.code])
    } else if (err.code) {
        logger.error(`Unhandled server error (${err.code}):`, err.message)
    } else {
        logger.error('Unknown server error:', err)
    }

    gracefulExit(1)
})

server.listen(config.port, config.host, () => {
    const { address, port } = server.address() as AddressInfo
    logger.info(`Server running at http://${address}:${port}`)
})
