import mongoose from "mongoose";



const connectDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Backend is successfully connected to the MongoDB");
    } catch (error) {
        console.log("MongoDB connect error", error);
        process.exit(1);
    }
}


export default connectDB;