import { Router } from 'express';
import healthRoute from './healthRoute.js';

const router = Router();

router.use('/health', healthRoute);

export default router;
