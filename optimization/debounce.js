const debounce = (fn, delay = 1000) => {
    let timeid;
    return function () {
        if(timeid) clearTimeout(timeid);
        setTimeout(() => {
            fn();
        }, delay)
    }
}

const printName = (name)=> {
    console.log(`my name is ${name}`)
}

const debounceFn= debounce(()=>printName('harsh saini'), 5000);
debounceFn();