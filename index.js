import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.listen(5000, () => {
    console.log('rodando')
});