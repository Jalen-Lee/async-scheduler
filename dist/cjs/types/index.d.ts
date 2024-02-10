import EventEmitter from 'eventemitter3';
import retryPromise, { RetryOptions } from './utils/retryPromise';
export interface ValidTask {
    taskFn: (value?: any) => Promise<any>;
    [key: string | symbol]: any;
}
export interface ValidTaskOptions {
    concurrency?: number;
    retry?: RetryOptions;
}
export type ValidTaskId = string | number | symbol;
export default class AsyncScheduler extends EventEmitter {
    static readonly TaskState: Readonly<{
        ALL_SETTLED: symbol;
        PARTIAL_SETTLED: symbol;
        TASK_RESOLVED: symbol;
        TASK_REJECTED: symbol;
    }>;
    static readonly retryPromise: typeof retryPromise;
    private readonly options;
    private readonly executeQueue;
    private readonly waitingQueue;
    constructor(options?: ValidTaskOptions);
    /**
     * @description 插入串行任务
     * @param id
     * @param tasks
     * @param initialValue
     * @param options
     */
    serial(id: ValidTaskId, tasks: Array<ValidTask>, initialValue?: any, options?: ValidTaskOptions): this;
    /**
     * @description 插入并行任务
     * @param id
     * @param tasks
     * @param initialValue
     * @param options
     */
    parallel(id: ValidTaskId, tasks: Array<ValidTask>, initialValue?: any, options?: ValidTaskOptions): this;
    /**
     * @description 任务执行
     */
    execute(): this;
    /**
     * @description 串行执行
     * @param tasks
     * @param initialValue
     * @param options
     * @private
     */
    private executeInSeries;
    /**
     * @description 并行执行
     * @param tasks
     * @param initialValue
     * @param options
     * @private
     */
    private executeInParallel;
}
