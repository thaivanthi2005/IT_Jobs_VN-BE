import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Database connected successfully (MongoDB Atlas)!");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};
