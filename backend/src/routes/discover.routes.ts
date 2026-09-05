import { Router } from 'express';
import { discoverCreators } from '../controllers/discover.controller.js';

const router = Router();

// GET /discover - Paginated discovery with category & goal filtering
router.get('/', discoverCreators as any);

export default router;
