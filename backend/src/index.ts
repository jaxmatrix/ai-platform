import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());

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
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
