Promise.customAllSettled = function (promises) {
    return new Promise((resolve, reject) => {
        const result = []
        let count = 0;
        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) => {
                    result[index] = { status: 'fullfilled', value }
                }).catch((err) => {
                    result[index] = { status: 'reject', region: err }
                }).finally(() => {
                    count++
                    if (count === promises.length) {
                        resolve(result)
                    }
                })
        })
    })
}

const promise1 = Promise.resolve(1);
const promise2 = Promise.reject(2);
const promise3 = new Promise((res, rej) => {
    res('i am done')
})
const promise4 = 'testing'

Promise.customAllSettled([promise1, promise2, promise3, promise4])
    .then((value) => console.log(value))
    .catch((err) => console.log(err))