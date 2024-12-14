import http from 'node:http'
import { AddressInfo } from 'node:net'
import { requestHandler } from '@/handler'
import { config } from '@/config'
import { asyncExitHook } from 'exit-hook'
import { logger } from '@/logger'

const server = http.createServer(requestHandler)

asyncExitHook(async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`)
    await new Promise((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve(null))
    })
}, { wait: 500 })

server.listen(config.port, config.host, () => {
    const { address, port } = server.address() as AddressInfo
    logger.info(`Server running at http://${address}:${port}`)
})
