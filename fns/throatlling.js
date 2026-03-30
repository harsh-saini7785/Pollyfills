const throatal = (fn, delay) => {
    let lastCall = 0;
    return () => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            fn();
            lastCall = now;
        }
    };
};