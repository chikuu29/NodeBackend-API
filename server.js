// const logger=require('./middleware/logger');
const express=require('express');
const cors=require('cors');

const corsOption={
    "origin":"*"
}

const app=express();
// const contactRoutes=require('./routes/contacts');
const AuthRoutes=require('./routes/AuthUrl')
// const dbModule = require('./config/db.conn');

const port=process.env.PORT||7000

app.use(cors(corsOption));
app.use(express.json());
// app.use(logger);

//app.use(contactRoutes);
//app.use(userRoutes);
app.use('',AuthRoutes);
// app.use('/api/contact',contactRoutes);


// (async () => {
//   try {
//     global.db = await dbModule.connect();
//     // Use the connected database here

//     // Close the MongoDB connection when done
//     // dbModule.closeConnection();
//   } catch (err) {
//     console.error('Error:', err);
//   }
// })();

app.listen(port,()=>{
    console.log(`server started at port ${port}`);
})