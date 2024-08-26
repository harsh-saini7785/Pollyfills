function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length && !args.includes(curry.placeholder)) {
            return fn.apply(this, args);
        } else {
            return function (...nextArgs) {
                const newArr = args.map((item) => {
                    return item === curry.placeholder && nextArgs.length ? nextArgs.shift() : item
                }).concat(nextArgs)
                return curried.apply(this, newArr);
            }
        }
    }
}

curry.placeholder = Symbol();

function sum(a, b, c){
    return (a + b + c);
}

const curriedAdd1 = curry(sum);

console.log(curriedAdd1(1, curry.placeholder, 3)(2));
console.log(curriedAdd1(curry.placeholder, 2, curry.placeholder)(1)(3));