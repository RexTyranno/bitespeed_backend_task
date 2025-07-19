import { Request, Response } from 'express';
import { IdentifyService } from '../services/identifyService';

const service = new IdentifyService();

export async function identifyController(req: Request, res: Response) {
  try {
    const { email, phoneNumber } = req.body;
    const result = await service.identify({ email, phoneNumber });
    return res.json({ contact: result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}