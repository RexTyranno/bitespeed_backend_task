import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import identifyRoutes from './routes/identifyRoutes';

dotenv.config();
const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hey, you are not there yet. Send POST request to /identify to get a response" });
});

app.use('/identify', identifyRoutes);
export default app;