// const newPromise = new Promise((resolve, reject)=> {
//   reject('hii i am promise')
// })

// newPromise.then((value)=> {
//   console.log(value, 'value')
// }).catch((err)=> console.log(err))

class CustomPromise {
    constructor(executor) {
        this.onSuccess = null;
        this.onFail = null;
        this.value = null;
        this.fullFilled = false;
        this.isCalled = false;
        this.then = function (cb) {
            this.onSuccess = cb;
            if (this.fullFilled && !this.isCalled) {
                cb(this.value);
                this.isCalled = true
            }
            return this
        }
        this.catch = function (cb) {
            this.onFail = cb;
            if (this.fullFilled && !this.isCalled) {
                cb(this.value);
                this.isCalled = true
            }
            return this
        }
        executor(this.resolve.bind(this), this.reject.bind(this))
    }

    resolve(successValue) {
        this.fullFilled = true;
        this.value = successValue;
        if (typeof this.onSuccess === 'function') {
            this.onSuccess(successValue)
            this.isCalled = true;
        }
    }

    reject(failValue) {
        this.fullFilled = true;
        this.value = failValue;
        if (typeof this.onFail === 'function') {
            this.onFail(failValue)
            this.isCalled = true;
        }
    }
}

const test = new CustomPromise((res, rej) => {
      setTimeout(()=> {
    res('resolved')
      },1000)
});
test.then((value) => console.log(value))

