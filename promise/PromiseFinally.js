Promise.prototype.myFinally = function (callback) {
    this.then((value) => {
        Promise.resolve(callback()).then(() => value)
    },
        (err) => {
            Promise.resolve(callback()).then(() => { throw err })
        }
    )
}

function delay(){
    return new Promise((res, rej)=> {
        setTimeout(()=> {
            res('resolved')
        }, 1000)
    })
}

const p1 = delay();

p1.then((value)=> {
    console.log(value)
}).catch((err)=> console.log(err)).myFinally((value)=> console.log('i am finally', value))

