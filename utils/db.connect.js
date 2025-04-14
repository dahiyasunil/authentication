import mongoose from "mongoose";

function initializeDatabse(){
    mongoose
    .connect(process.env.MONGO_URL)
    .then(()=>{
        console.log("Connected to mongodb");
    })
    .catch((err)=>{
        console.error("Error connecting to mongodb");
    });
}

export default initializeDatabse;