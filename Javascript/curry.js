const curry = (a) => {
    const fn = (b) => curry(a + b);
    fn.valueOf = () => a;
    fn.toString = () => String(a);
    return fn
}

console.log(curry(1)(2)(3)(8))