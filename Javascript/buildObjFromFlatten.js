const obj = {
    'address.district.block': "ladwa",
    'address.village': "jogimajra",
    hobbies: ["cricket", "hockey", "coding"],
    lastname: "saini",
    name: "harsh"
}


const buildObjfromFlatten = (obj) => {
    const newObj = {};

    const buildObj = (obj) => {
        const keys = Object.keys(obj);
        keys.forEach((key, idx) => {
            let curr = newObj;
            const chunks = key.split('.');
            chunks.forEach((chunk, idx) => {
                if (chunks.length - 1 === idx) {
                    curr[chunk] = obj[key];
                } else {
                    if (!curr[chunk]) {
                        curr[chunk] = {};
                    }
                    curr = curr[chunk];
                }
            })
        })
    }

    buildObj(obj);
    return newObj
}

console.log(buildObjfromFlatten(obj))