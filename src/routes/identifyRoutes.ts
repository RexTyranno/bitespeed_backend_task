import { Router } from 'express';
import { identifyController } from '../controllers/identifyController';

const router = Router();
router.post('/', identifyController);
export default router;