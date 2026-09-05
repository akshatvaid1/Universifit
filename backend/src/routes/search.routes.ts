import { Router } from 'express';
import { globalSearch } from '../controllers/search.controller.js';

const router = Router();

// GET /search and /api/search
router.get('/', globalSearch);

export default router;
