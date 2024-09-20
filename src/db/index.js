import mongoose from "mongoose";
import {DBNAME} from "../constants.js"


const dbConnection =async ()=>{
    try {
        const conn=await mongoose.connect(`${process.env.DATABASE_URL}/${DBNAME}`);
        console.log("Database Connected !! " + conn)
    } catch (error) {
        console.log('Error connecting to MongoDB: ' + error)
        process.exit(1);
    }
}
export default dbConnection;