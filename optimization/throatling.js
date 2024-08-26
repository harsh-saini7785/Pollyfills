const throat = (fn, delay = 1000) => {
    let flag = true;
    return function () {
        if (flag) {
            fn();
            flag = false;
            setTimeout(() => {
                flag = true;
            }, delay)
        }
    }
}

const printName = ()=> {
    console.log('my name is harsh saini')
}

const throatFn = throat(printName, 300);
throatFn()
