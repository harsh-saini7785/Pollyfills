class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) {
            return -1
        }
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key)
        }

        this.cache.set(key, value);

        if (this.cache.size > this.capacity) {
            const lruKey = this.cache.keys().next().value;
            this.cache.delete(lruKey);
        }
    }
}

const cache = new LRUCache(2);
cache.put('name', 'harsh');
cache.put('lastName', 'saini');
cache.put('age', '24');
console.log(cache.get('name'));
console.log(cache.get('age'))