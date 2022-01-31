import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import "dayjs/locale/pt-br.js";
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.listen(5000, () => {
    console.log('rodando')
});

const nameSchema = joi.object({
    name: joi.string().case('lower').required(),
});

app.post('/participants', async (req, res) => {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
  
    const validation = nameSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
      const errors = validation.error.details.map(detail => detail.message);
      res.status(422).send(errors);
      return;
    }

    try {
        await mongoClient.connect();

        const participants = await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('participants')
        .find({})
        .toArray();
    
        const existingUser = participants.find(user => user.name.toLowerCase() === req.body.name.toLowerCase());
    
        if (existingUser) {
            res.sendStatus(409);
            return;
        }

        await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('participants')
        .insertOne({
            name: req.body.name,
            lastStatus: Date.now(),
        });

        await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('messages')
        .insertOne({
        from: req.body.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`,
        });

        res.sendStatus(201);

        mongoClient.close();
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
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