import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { setupSwagger } from './swagger';
import axios from 'axios';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const AI_API = process.env.AI_API || 'http://n8n:5678';

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

setupSwagger(app);

const port = process.env.PORT || 5000;

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get welcome message
 *     description: Returns a welcome message
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get('/', (req, res) => {
  console.log("Calling hello world")
  res.json({ message: 'Hello world' });
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on("user_message", async (data) => {

    console.log("Received message from user:", data);
    const api = `${AI_API}/webhook/${data.aiMode}`

    try {
      const response = await axios.post(api, {
        "id": data.chatid,
        "message": data.content,
        "type": "text"
      })

      console.log("RESPONSE FROM AI:", typeof (response.data), response.data);

      socket.emit("ai_message", response.data);

    } catch (error) {
      socket.emit("ai_message", { content: "Error sending the message to AI" + ` ${api}` })
      console.error("ERROR SENDING REQUEST TO", error)

    }

  })
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
