const useDebouce = (value, delay = 500) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setValue('');
        }, delay)
        return (() => clearTimeout(timer));
    }, [value, delay])

    return value;
}

const debounce = (fn, delay = 500) => {
    let timer;

    return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay)
    }
}