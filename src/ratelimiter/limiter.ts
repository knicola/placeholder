import { createStore } from './store'

export interface RateLimiterConfig {
    capacity: number
    interval: number
    maxStoreSize?: number
}

export interface RateLimiterResult {
    exceeded: boolean
    remaining: number
    timestamp: number
}

type Subject = string | Symbol
interface Counter {
    tokens: number
    updatedAt: number
}

export function createRateLimiter (config: RateLimiterConfig): {
    check: (subject: string) => RateLimiterResult
} {
    const store = createStore<Subject, Counter>({
        maxSize: config.maxStoreSize,
    })

    function check (subject: string): RateLimiterResult {
        const { capacity, interval } = config
        const now = Date.now()

        const record = store.get(subject)

        if (! record) {
            const remaining = capacity - 1
            store.set(subject, { tokens: remaining, updatedAt: now })
            return { exceeded: false, remaining, timestamp: now }
        }

        const { tokens, updatedAt } = record
        const elapsed = now - updatedAt

        const refillTokens = Math.floor((elapsed / interval) * capacity)
        const newTokens = Math.min(capacity, tokens + refillTokens)

        if (newTokens > 0) {
            const remaining = newTokens - 1
            store.set(subject, { tokens: remaining, updatedAt: now })
            return { exceeded: false, remaining, timestamp: now }
        } else {
            return { exceeded: true, remaining: 0, timestamp: now }
        }
    }

    return { check }
}
