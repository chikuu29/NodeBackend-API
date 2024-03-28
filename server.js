const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const cors = require('cors');
const cronScheduler = require('./commonServices/cronScheduler');
//scheduler lock file should be removed before running the scheduler
const corsOption = {
    origin: ["http://localhost:3000"],
    credentials:true
};
const AuthRoutes = require('./routes/AuthUrl');
const productRoutes= require('./routes/productRoutes')
const port = process.env.PORT || 7000;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
    const app = express();
    app.use(cors(corsOption));
    app.use(express.json());
    app.get('/', (req, res) => {
        res.send('<h1>Node Backend Server Is Running</h1>');
    });
    app.use('/auth', AuthRoutes);
    app.use("/v1/product",productRoutes)
    app.listen(port, () => {
        console.log(`Worker ${process.pid} started server at port ${port}`);
    });
}

