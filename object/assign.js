Object.prototype.customAssign = function (target) {
    if (target === null) {
        throw new TypeError('can not convert undefine or null to object');
    }

    target = Object(target);
    for (let i = 1; i < arguments.length; i++) {
        let source = arguments[i]
        if(source !== null){
            for(let key in source){
                if(Object.prototype.hasOwnProperty.call(source, key)){
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
}

const target = { a: 1, b: 2 };
const source1 = { b: 4, c: 5 };
const source2 = { d: 6 };

const result = Object.assign(target, source1, source2);
console.log(result); // { a: 1, b: 4, c: 5, d: 6 }

