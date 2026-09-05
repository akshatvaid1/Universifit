import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '../controllers/wishlist.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// All wishlist endpoints require authentication
router.use(authenticateJWT);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:offerId', removeFromWishlist);

export default router;
