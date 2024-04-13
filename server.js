const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const cors = require('cors');
const cronScheduler = require('./commonServices/cronScheduler');
//scheduler lock file should be removed before running the scheduler

const corsOption = {
    "origin": "*"
};

const AuthRoutes = require('./routes/AuthUrl');

const port = process.env.PORT || 7000;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers with a delay
    let forkIndex = 0;
    const forkWorkerWithDelay = () => {
        if (forkIndex < numCPUs) {
            setTimeout(() => {
                cluster.fork();
                forkIndex++;
                forkWorkerWithDelay();
            }, 2000);
        }
    };
    forkWorkerWithDelay();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const app = express();
    app.use(cors(corsOption));
    app.use(express.json());
    app.use('/user', AuthRoutes);

    app.listen(port, () => {
        console.log(`Worker ${process.pid} started server at port ${port}`);
    });
}
