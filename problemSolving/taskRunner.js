const arr = [];
for (let i = 0; i < 10; i++) {
    arr[i] = i % 2 === 0 ? 'https://fakestoreapi.com/products' : 'https://fakestoreapi.com/products/1';
}

const taskRunner = (tasks) => {
    const queue = [];
    let activeTasks = 0;
    const maxCountTask = 2;

    const fetchTask = async (task) => {
        try {
            activeTasks++;
            const data = await fetch(task)
            return data;
        } catch (err) {
            console.log(err, 'error')
        } finally {
            activeTasks--;
            processQueue()
        }
    }

    const processQueue = () => {

        while (queue.length && activeTasks < maxCountTask) {
            const task = queue.shift();
            fetchTask(task);
        }
    }

    for (let i = 0; i < tasks.length; i++) {
        queue.push(tasks[i]);
        processQueue()
    }
}

taskRunner(arr)