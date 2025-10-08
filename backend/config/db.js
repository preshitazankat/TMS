import mongoose from "mongoose";  


const URL="mongodb://localhost:27017/mydatabase"

const connectDB = async () => {
  try {
    await mongoose.connect(URL
, );
    console.log("✅ MongoDB Connected...");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
