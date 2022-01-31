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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required(),
    from: joi.string().required(),
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

app.post('/messages', async (req, res) => {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
  
    const validation = messageSchema.validate(req.body, { abortEarly: false });
  
    if (validation.error) {
        const errors = validation.error.details.map(detail => detail.message);
        res.status(422).send(errors);
        return;
    }
  
    try {
        await mongoClient.connect();

        await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('messages')
        .insertOne({
          from: req.headers.user,
          to: req.body.to,
          text: req.body.text,
          type: req.body.type,
          time: `${dayjs().hour()}:${dayjs().minute()}:${dayjs().second()}`,
        });

        res.sendStatus(201);

        mongoClient.close();
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

app.get('/messages', async (req, res) => {
    const mongoClient = new MongoClient(process.env.MONGO_URI);

    try {
        await mongoClient.connect();

        const messages = await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('messages')
        .find({})
        .toArray();

        const filteredMessages = messages.filter(
            msg => (msg.type === 'private_message' && msg.to === req.headers.user) ||
            msg.from === req.headers.user || msg.to === 'Todos' || msg.type === 'message'
        );

        if (req.query.limit) {
            res.status(200).send(filteredMessages.slice(-req.query.limit));
        } else {
            res.status(200).send(filteredMessages);
        }

        mongoClient.close();
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

app.post('/status', async (req, res) => {
    const mongoClient = new MongoClient(process.env.MONGO_URI);

    try {
        await mongoClient.connect();

        const participants = await mongoClient
        .db(process.env.MONGO_NAME)
        .collection('participants')
        .find({})
        .toArray();
    
        const user = participants.find(user => user.name === req.headers.user);
        
        if (!user) {
            res.sendStatus(404);

            mongoClient.close();
        } else {
            await mongoClient
            .db(process.env.MONGO_NAME)
            .collection('participants')
            .updateOne(
                { name: user.name },
                {
                    $set: { lastStatus: Date.now() },
                }
            );

            res.sendStatus(200);
            
            mongoClient.close();
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});