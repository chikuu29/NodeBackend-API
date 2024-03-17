const schedule = require('node-schedule');

function scheduleTask(taskName, cronExpression, callback) {
    const job = schedule.scheduleJob(taskName, cronExpression, callback);
    console.log(`Scheduled task '${taskName}' with cron expression '${cronExpression}'`);
    return job;
}

// Example usage
function myTask() {
    console.log("Executing my task at", new Date());
}

// Define your task settings
const taskName = "MyTask";
const cronExpression = "* * 4 * * *"; // Every 5 minutes
// Schedule the task
scheduleTask(taskName, cronExpression, myTask);
