import EventEmitter from 'eventemitter3'
import retryPromise, { RetryOptions } from './utils/retryPromise'

export interface ValidTask {
  taskFn: (value?: any) => Promise<any>
  [key: string | symbol]: any
}

export interface ValidTaskOptions {
  // 最大并发数
  concurrency?: number
  // 重试，为true且没有配置retryCount、retryInterval则使用指数退避算法
  retry?: RetryOptions
}

export type ValidTaskId = string | number | symbol

enum ValidTaskType {
  SERIAL,
  PARALLEL
}

const ValidTaskState = Object.freeze({
  ALL_SETTLED: Symbol('AsyncScheduler#all_settled'),
  PARTIAL_SETTLED: Symbol('AsyncScheduler#partial_settled'),
  TASK_RESOLVED: Symbol('AsyncScheduler#task_resolved'),
  TASK_REJECTED: Symbol('AsyncScheduler#task_rejected')
})

export default class AsyncScheduler extends EventEmitter {
  static readonly TaskState = ValidTaskState
  static readonly retryPromise = retryPromise

  private readonly options: ValidTaskOptions = {
    concurrency: 6,
    retry: {
      enable: true
    }
  }

  // 执行队列
  private readonly executeQueue: Array<ValidTask> = []
  // 等候队列
  private readonly waitingQueue: Array<{
    id: ValidTaskId
    type: ValidTaskType
    tasks: Array<ValidTask>
    options?: ValidTaskOptions
    initialValue?: any
  }> = []

  constructor(options?: ValidTaskOptions) {
    super()
    this.options = Object.assign(this.options, options)
  }

  /**
   * @description 插入串行任务
   * @param id
   * @param tasks
   * @param initialValue
   * @param options
   */
  public serial(
    id: ValidTaskId,
    tasks: Array<ValidTask>,
    initialValue?: any,
    options: ValidTaskOptions = {}
  ) {
    if (!Array.isArray(tasks)) {
      throw TypeError(
        "Failed to execute 'parallel' on 'AsyncTaskScheduler': Parameter 2 <tasks> must be an array!"
      )
    }
    options = Object.assign({}, this.options, options)
    this.waitingQueue.push({
      type: ValidTaskType.SERIAL,
      id,
      tasks,
      initialValue,
      options
    })
    return this
  }

  /**
   * @description 插入并行任务
   * @param id
   * @param tasks
   * @param initialValue
   * @param options
   */
  public parallel(
    id: ValidTaskId,
    tasks: Array<ValidTask>,
    initialValue?: any,
    options: ValidTaskOptions = {}
  ) {
    if (!Array.isArray(tasks)) {
      throw TypeError(
        "Failed to execute 'parallel' on 'AsyncTaskScheduler': Parameter 2 <tasks> must be an array!"
      )
    }
    options = Object.assign({}, this.options, options)
    this.waitingQueue.push({
      type: ValidTaskType.PARALLEL,
      id,
      tasks,
      initialValue,
      options
    })
    return this
  }

  /**
   * @description 任务执行
   */
   public execute() {
    if (this.waitingQueue.length === 0) {
      console.warn(
        `[AsyncTaskScheduler]：The queue of tasks to be executed is empty.Use the "serial","parallel" method to add tasks.`
      )
    }

    this.waitingQueue.forEach((item) => {
      if (item.type === ValidTaskType.SERIAL) {
        this.executeQueue.push({
          id: item.id,
          taskFn: () => {
            return this.executeInSeries(
              item.tasks,
              item.initialValue,
              item.options
            )
          }
        })
      } else if (item.type === ValidTaskType.PARALLEL) {
        this.executeQueue.push({
          id: item.id,
          taskFn: () => {
            return this.executeInParallel(
              item.tasks,
              item.initialValue,
              item.options
            )
          }
        })
      }
    })

    if (this.executeQueue.length > 0) {
      this.executeInSeries(this.executeQueue).then(({ results }) => {
        this.emit(ValidTaskState.ALL_SETTLED, results)
      })
    }
    return this
  }

  /**
   * @description 串行执行
   * @param tasks
   * @param initialValue
   * @param options
   * @private
   */
  private async executeInSeries(
    tasks: Array<ValidTask>,
    initialValue?: any,
    options: ValidTaskOptions = this.options
  ) {
    const results = []
    let lastValue = initialValue
    for (const { taskFn, ...restProps } of tasks) {
      if (typeof taskFn !== 'function') {
        throw new TypeError(
          '[AsyncScheduler]: <taskFn> must be a function that returns a promise!'
        )
      }
      try {
        const res = await AsyncScheduler.retryPromise(
          () => taskFn(lastValue),
          options.retry
        )
        const payload = {
          ...restProps,
          result: res
        }
        this.emit(ValidTaskState.TASK_RESOLVED, payload)
        results.push(payload)
        lastValue = res
      } catch (e) {
        const payload = {
          ...restProps,
          result: e
        }
        this.emit(ValidTaskState.TASK_REJECTED, payload)
        results.push(payload)
      }
    }
    return {
      lastValue,
      results
    }
  }

  /**
   * @description 并行执行
   * @param tasks
   * @param initialValue
   * @param options
   * @private
   */
  private executeInParallel(
    tasks: Array<ValidTask>,
    initialValue?: any,
    options: ValidTaskOptions = this.options
  ) {
    return new Promise<any[]>((resolve, reject) => {
      let currentIndex = 0
      const results: Promise<any>[] = []
      const executors: Promise<any>[] = []

      const enqueue = () => {
        if (currentIndex === tasks.length) {
          return Promise.resolve()
        }
        const { taskFn, ...restProps } = tasks[currentIndex++]
        if (typeof taskFn !== 'function') {
          throw new TypeError(
            '[AsyncScheduler]: <taskFn> must be a function that returns a promise!'
          )
        }
        const p = AsyncScheduler.retryPromise(
          () => taskFn(initialValue),
          options.retry
        )
          .then((res) => {
            const payload = {
              result: res,
              ...restProps
            }
            this.emit(ValidTaskState.TASK_RESOLVED, payload)
            return payload
          })
          .catch((e) => {
            this.emit(ValidTaskState.TASK_REJECTED, {
              result: e,
              ...restProps
            })
          })
        results.push(p)

        let r = Promise.resolve()
        if (options.concurrency <= tasks.length) {
          const e = p.then(() => {
            return executors.splice(executors.indexOf(e), 1)
          })
          executors.push(e)
          if (executors.length >= options.concurrency) {
            r = Promise.race(executors)
          }
        }
        return r.then(() => enqueue())
      }
      enqueue()
        .then(() => Promise.all(results))
        .then(resolve)
    })
  }
}
