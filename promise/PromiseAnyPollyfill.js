Promise.customAny = function(promises){
    let count = 0;
    return new Promise((resolve, reject)=> {
        promises.forEach((promise)=> {
            Promise.resolve(promise)
            .then((value)=> resolve(value))
            .catch((err)=> {
                count++;
                if(count === promises.length){
                    reject(err)
                }
            })
        })
    })
}

const promise1 = Promise.reject(1);
const promise2 = Promise.reject(2);
const promise3 = new Promise((res, rej) => {
    rej('i am done')
})
// const promise4 = 'testing'

Promise.customAny([promise1, promise2, promise3])
    .then((value) => console.log(value))
    .catch((err) => console.log(err))