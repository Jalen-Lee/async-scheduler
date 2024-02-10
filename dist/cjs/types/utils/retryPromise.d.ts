export type RetryOptions = {
    enable?: boolean;
    retryCount?: number;
    retryInterval?: number;
};
export default function retryPromise<T>(promiseFunc: () => Promise<T>, retryOptions?: RetryOptions): Promise<T>;
