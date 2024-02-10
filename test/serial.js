const AsyncScheduler = require('../dist/cjs/AsyncScheduler.min')

const tasks1 = new Array(5).fill(true).map((value, index) => {
  return {
    id: index + 1,
    taskFn: function (prevValue) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log(`任务${index + 1}正在执行`)
          resolve(prevValue + index + 1)
        }, 1000)
      })
    }
  }
})

tasks1[3] = {
  id: 4,
  taskFn: function (prevValue) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(`任务4正在执行`)
        reject('任务4失败')
      }, 1000)
    })
  }
}

const tasks2 = new Array(10).fill(true).map((value, index) => {
  return {
    id: index + 5,
    taskFn: function (prevValue) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log(`任务${index + 5}正在执行`)
          resolve()
        }, 1000)
      })
    }
  }
})

new AsyncScheduler()
  .addListener(AsyncScheduler.TaskState.TASK_RESOLVED, (res) => {
    const { id, result } = res
    console.log(
      `任务${id}已完成，结果：${JSON.stringify(result, undefined, ' ')}`
    )
  })
  .addListener(AsyncScheduler.TaskState.ALL_SETTLED, (res) => {
    console.log('ALL_SETTLED', JSON.stringify(res, undefined, ' '))
  })
  .serial('#1', tasks1, 0, {
    retry: {
      retryCount: 3,
      retryInterval: 1000
    }
  })
  .parallel('#2', tasks2)
  .execute()
