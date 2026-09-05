import { Router } from 'express';
import {
  getAllCommunityPosts,
  createGlobalPost,
  createPostReply,
  togglePostLike,
  togglePinPost,
  deletePost,
  deletePostReply,
  reportPost,
  getReportedPostsForCreator,
  dismissReport,
} from '../controllers/community.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// GET /posts & /community/posts - Fetch community feed
router.get('/', getAllCommunityPosts);
router.get('/posts', getAllCommunityPosts);

// POST /posts & /community/posts - Create community discussion
router.post('/', authenticateJWT, createGlobalPost);
router.post('/posts', authenticateJWT, createGlobalPost);

// Moderation: Pin/Unpin Post (Creator only)
router.patch('/:id/pin', authenticateJWT, togglePinPost);
router.patch('/posts/:id/pin', authenticateJWT, togglePinPost);

// Moderation: Delete Post (Author/Creator)
router.delete('/:id', authenticateJWT, deletePost);
router.delete('/posts/:id', authenticateJWT, deletePost);

// Moderation: Delete Reply (Author/Creator)
router.delete('/replies/:replyId', authenticateJWT, deletePostReply);
router.delete('/posts/replies/:replyId', authenticateJWT, deletePostReply);

// Moderation: Report/Flag Inappropriate Post (Buyers)
router.post('/:id/report', authenticateJWT, reportPost);
router.post('/posts/:id/report', authenticateJWT, reportPost);

// Moderation: View Reported Posts Queue (Creator Dashboard)
router.get('/reported/:creatorId', authenticateJWT, getReportedPostsForCreator);
router.get('/posts/reported/:creatorId', authenticateJWT, getReportedPostsForCreator);

// Moderation: Dismiss Flag/Report (Creator Dashboard)
router.patch('/:id/dismiss-report', authenticateJWT, dismissReport);
router.patch('/posts/:id/dismiss-report', authenticateJWT, dismissReport);

// POST /posts/:id/replies & /posts/:id/comments - Reply to a post (awards +5 points)
router.post('/:id/replies', authenticateJWT, createPostReply);
router.post('/posts/:id/replies', authenticateJWT, createPostReply);
router.post('/:id/comments', authenticateJWT, createPostReply);
router.post('/posts/:id/comments', authenticateJWT, createPostReply);

// POST /posts/:id/like - Like or unlike a post
router.post('/:id/like', authenticateJWT, togglePostLike);
router.post('/posts/:id/like', authenticateJWT, togglePostLike);

export default router;


