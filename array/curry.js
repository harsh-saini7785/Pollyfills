function curry(fn){
    return function curried(...args){
        if(args.length >= fn.length){
            return fn.apply(this, args)
        }else{
            return function(...nextArgs){
                return curried.apply(this, args.concat(nextArgs))
            }
        }
    }
}

function sum(a, b, c){
    return (a + b + c)
}

const test = curry(sum);
console.log(test(1)(2)(11))
