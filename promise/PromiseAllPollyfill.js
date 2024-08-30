Promise.customAll = function (promises) {
    let count = 0;
    const result = []
    return new Promise((resolve, rej) => {
        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then((value) => {
                    result[index] = value
                    count += 1
                    if (count === promises.length) {
                        resolve(result)
                    }
                })
                .catch((error) => rej('reject'))
        })
    })
}

const promise1 = Promise.resolve(1);
const promise2 = Promise.resolve(2);
const promise3 = new Promise((res, rej) => {
    res('i am done')
})
const promise4 = 'testing'

Promise.customAll([promise1, promise2, promise3, promise4])
    .then((value) => console.log(value))
    .catch((err) => console.log(err))
