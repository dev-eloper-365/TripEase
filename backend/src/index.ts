import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import cors from 'cors';
import { userRouter } from './userRouter';
import { chatRouter } from './chatRouter';
dotenv.config()
const app = express();  
app.use(cors());  
app.use(express.json());
app.use("/user", userRouter);
app.use("/chat", chatRouter);


app.listen(3001, async () => {
    await mongoose.connect("mongodb+srv://user1:12345678SRP@cluster0.9egnm.mongodb.net/MainDB" as string)
    console.log('listening');
})