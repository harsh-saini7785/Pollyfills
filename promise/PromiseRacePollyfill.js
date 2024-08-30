Promise.customRace = function(promises){
    return new Promise((resolve, reject)=> {
        promises.forEach((promise)=> {
            Promise.resolve(promise).then((value)=> resolve(value)).catch((err)=> reject(err))
        })
    })
}
const promise1 = new Promise((resolve, reject)=> {
    setTimeout(()=> {
        resolve('first')
    },1000)
})
const promise2 = new Promise((resolve, reject)=> {
    setTimeout(()=> {
        reject('two reject')
    },300)
})
// const promise3 = Promise.resolve('3')

Promise.customRace([promise1, promise2])
    .then((value) => console.log(value))
    .catch((err) => console.log(err))