import http from 'node:http'
import { AddressInfo } from 'node:net'
import { requestHandler } from '@/handler'
import { config } from '@/config'
import { logger } from '@/logger'

const server = http.createServer(requestHandler)

server.listen(config.port, config.host, () => {
    const { address, port } = server.address() as AddressInfo
    logger.info(`Server running at http://${address}:${port}`)
})
