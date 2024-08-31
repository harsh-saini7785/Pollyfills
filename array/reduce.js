Array.prototype.myReduce = function (cb, initialValue) {
    let acc, startIndex
    if (arguments.length >= 2) {
        startIndex = 0;
        acc = initialValue;
    }
    else {
        startIndex = 1;
        acc = this[0];
    }
    for (let i = startIndex; i < this.length; i++) {
        acc = cb(acc, this[i]);
    }
    return acc;
}


const arr = [1, 2, 3, 4, 5];

const ans = arr.myReduce((acc, item) => {
    acc += item;
    return acc;
})

console.log(ans, 'ans')