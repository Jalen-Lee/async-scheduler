const AsyncTaskScheduler = require('../dist/cjs/AsyncTaskScheduler.min')

const tasks = new Array(40).fill(true).map((value, index)=>{
  return function (){
    return new Promise((resolve, reject)=>{
      setTimeout(()=>{
        console.log(`任务${index}正在执行`)
        resolve(index);
      },1000)
    })
  }
})
// tasks[25] = function (){
//   return new Promise((resolve, reject)=>{
//     setTimeout(()=>{
//       console.log(`任务${50}执行失败`)
//       reject(50);
//     },1000)
//   })
// }




const scheduler = new AsyncTaskScheduler({
  skipReject: false
})
  // .serial(tasks)
  .addListener(AsyncTaskScheduler.EVENT.ALL_SETTLED,(res)=>{
    console.log("全部任务执行完成",res)
  })
  .addListener(AsyncTaskScheduler.EVENT.PARTIAL_SETTLED,(res)=>{
    console.log("部分任务执行完成",res)
  })
  .execute()

