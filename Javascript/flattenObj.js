const obj = {
    name: 'harsh',
    lastname: 'saini',
    address: {
        village: 'jogimajra',
        district: {
            block: 'ladwa'
        }
    },
    hobbies: ['cricket', 'hockey', 'coding']
}


const flatObj = (obj) => {
    const newObj = {};
    const flattenObj = (obj, parent) => {

        const keys = Object.keys(obj);
        keys.forEach((key, idx) => {
            const parentKey = parent ? `${parent}.${key}` : key
            if (typeof obj !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                flattenObj(obj[key], parentKey)
            } else {
                newObj[parentKey] = obj[key]
            }
        })
    }

    flattenObj(obj, '')

    return newObj

}

console.log(flatObj(obj))





