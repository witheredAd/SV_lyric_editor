export const debounce =
<T extends any[], U> (millis: number, func: (...args: T) => U | Promise<U>) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return (...args: T) => new Promise<U>((r) => {
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => {
            r(func(...args))
        }, millis);
    })
}
