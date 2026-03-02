import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        console.log("URI:", process.env.MONGODB_URI);
        console.log("server is running on Port:", process.env.PORT);

       const connectionInstance = await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`MONGODB connected: DB HOST: ${connectionInstance.connection.host}`);
    } catch(error){
        console.log("MONGODB connection error: ", error);
        process.exit(1);
    }
}

export default connectDB;