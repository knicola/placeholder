/* eslint-disable no-console */
import http from 'http'
import { AddressInfo } from 'net'
import { requestHandler } from '@/handler'
import { config } from '@/config'

const server = http.createServer(requestHandler)

server.listen(config.port, config.host, () => {
    const { address, port } = server.address() as AddressInfo
    console.info(`Server running at http://${address}:${port}`)
})
