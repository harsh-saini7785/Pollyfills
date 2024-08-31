const arr = [1, 2, 3, [3, 4, [5, 6]], 7];

Array.prototype.myFlat = function (count = 1) {
    const arr = this;
    const result = [];
    const flatArray = (a, count) => {
        for (let i = 0; i < a.length; i++) {
            if (Array.isArray(a[i]) && count) {
                flatArray(a[i], --count);
            } else {
                result.push(a[i]);
            }
        }
    }
    flatArray(arr, count);
    return result;
}

console.log(arr.myFlat(1))