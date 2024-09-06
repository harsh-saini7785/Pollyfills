const obj = {
    name: 'harsh',
    lastname: 'saini',
    isMarried: 'false',
    hobbies: ['cricket', 'exploring new things', 'mobile games'],
    test: {
        name: 'test',
        lastName: 'again test',
        pc: 'lanova'
    }
}

JSON.customStringify = function (data) {
    function stringfy(value) {
        if (!value) {
            return null;
        }

        switch (typeof value) {
            case 'number': {
                return String(value)
            }
            case 'string': {
                return '"' + value + '"';
            }
            case 'boolean': {
                return value ? 'true' : 'false';
            }
            case 'object': {
                if (Array.isArray(value)) {
                    const elements = value.map((item) => {
                        return stringfy(item)
                    })
                    return "[" + elements.join(',') + "]"
                } else {
                    const keys = Object.keys(value);
                    const pairs = keys.map((key) => {
                        const str = stringfy(key);
                        const ans = stringfy(value[key]);
                        return str + ':' + ans
                    })

                    return '{' + pairs.join(',') + '}'
                }
            }
            default: return undefined
        }
    }
    return stringfy(data)
}

console.log(JSON.customStringify(obj))