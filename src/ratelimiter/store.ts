export interface RateLimiterStore<Subject = string, Counter = Record<any, any>> {
    get: (subject: Subject) => Counter | undefined
    set: (subject: Subject, record: Counter) => void
    delete: (subject: Subject) => void
    clear: () => void
}

export interface StoreOptions {
    maxSize?: number
}

export function createStore<Subject = string, Counter = Record<any, any>> (options?: StoreOptions): RateLimiterStore<Subject, Counter> {
    const { maxSize = Number.POSITIVE_INFINITY } = options || {}

    let store = new Map<Subject, Counter>()
    let oldStore = new Map<Subject, Counter>()

    function _get (subject: Subject): Counter | undefined {
        if (store.has(subject)) {
            return store.get(subject)
        }

        if (oldStore.has(subject)) {
            const record = oldStore.get(subject) as Counter
            store.set(subject, record)
            return record
        }
    }

    function _set (subject: Subject, record: Counter): void {
        if (store.size >= maxSize) {
            oldStore = store
            store = new Map<Subject, Counter>()
        }

        store.set(subject, record)
    }

    function _delete (subject: Subject): void {
        store.delete(subject)
        oldStore.delete(subject)
    }

    function _clear (): void {
        store.clear()
        oldStore.clear()
    }

    return {
        get: _get,
        set: _set,
        delete: _delete,
        clear: _clear,
    }
}
