import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.listen(5000, () => {
    console.log('rodando')
});

app.get('/participants', async (req, res) => {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    
    try {
        await mongoClient.connect();

        const participants = await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('participants')
        .find({})
        .toArray();

        res.status(200).send(participants);

        mongoClient.close();

    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});