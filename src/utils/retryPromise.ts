export type RetryOptions = {
  enable?: boolean
  retryCount?: number
  retryInterval?: number
}

export default function retryPromise<T>(
  promiseFunc: () => Promise<T>,
  retryOptions?: RetryOptions
): Promise<T> {
  if (typeof promiseFunc !== 'function') {
    throw new TypeError(
      '[retryPromise]: Argument 1 must be a function that returns a promise!'
    )
  }
  return new Promise<T>((resolve, reject) => {
    const { enable = true, retryInterval, retryCount } = retryOptions || {}
    let attempt = 0
    const retry = () => {
      Promise.resolve(promiseFunc())
        .then(resolve)
        .catch((error) => {
          if (enable) {
            if (
              typeof retryCount === 'number' &&
              typeof retryInterval === 'number'
            ) {
              if (++attempt < retryCount) {
                setTimeout(() => retry(), retryInterval)
              } else {
                reject(error)
              }
            } else {
              if (++attempt < (retryCount || 3)) {
                const interval = Math.min(1000 * 2 ** ++attempt, 30 * 1000)
                setTimeout(() => retry(), interval)
              } else {
                reject(error)
              }
            }
          } else {
            reject(error)
          }
        })
    }
    retry()
  })
}
