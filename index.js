import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { Server } from 'socket.io';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const port = 3000;
const hostname = "localhost";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const server = app.listen(port, hostname, () => {
    console.log(`API is running at http://${hostname}:${port}`);
});

const io = new Server(server);


const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


io.on('connection', async (socket) => {
    console.log('A user connected');

    try {
        const result = await db.query("SELECT * FROM sensor_data ORDER BY id ASC");
        let allData = result.rows;
        socket.emit('initial_data', allData);
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    } catch (error) {
        console.error("Error fetching data on connection:", error);
    }
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});



app.get("/", (req, res) => {

    res.send(`<p>Use /api to get the data</p><p>Use /data to post the data</p>`);
});


app.get("/api", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM sensor_data ORDER BY id ASC");
        let items = result.rows;
        res.json(items);
    } catch (error) {
        console.log(error);
    }

});


app.post("/data", async (req, res) => {
    const {
        device1: { deviceId: device1_deviceId, current: device1_current, power: device1_power },
        device2: { deviceId: device2_deviceId, current: device2_current, power: device2_power },
    } = req.body;

    try {
        const insertResult = await db.query(
            "INSERT INTO sensor_data (device1_deviceId, device1_current, device1_power, device2_deviceId, device2_current, device2_power, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [device1_deviceId, device1_current, device1_power, device2_deviceId, device2_current, device2_power, new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })
            ]
        );
        
        const insertedData = insertResult.rows[0];



        io.emit('new_data', insertedData);


        res.status(201).json(insertedData);
    } catch (err) {

        res.status(500).send("Error inserting data");
    }
});

app.get("/data", (req, res) => {
    res.send(`<p> Use in your app to post data to database</p>`);
});

app.post("/reset", async (req, res) => {
    try {
        
        await db.query("TRUNCATE TABLE sensor_data RESTART IDENTITY");
        const resetData = []
        io.emit('initial_data', resetData);
 

        
        res.status(200).send("Table truncated successfully");
    } catch (err) {
        res.status(500).send("Error truncating table");
    }
});
app.get("/reset", (req, res) => {
    res.send(`<p> Use in your app to reset all data in your database</p>`);
});


app.post('/ai', async (req, res) => {

    try {

        const result = await db.query("SELECT * FROM sensor_data ORDER BY id ASC");
        let items = result.rows;


        const { message } = req.body;
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: "Based on the collected current and power consumption data, answer user questions related to current, voltage, power, and energy usage. Provide fixed, straightforward information to make it easy for the user to understand. Focus on informative, clear, and concise responses: " + JSON.stringify(items) }, { role: 'user', content: message }],
        });
 
        const aiMessage = chatCompletion.choices[0]?.message.content;
        res.json({ response: aiMessage });
    } catch (error) {
        res.status(500).send('backend error, try again later');
    }
});





