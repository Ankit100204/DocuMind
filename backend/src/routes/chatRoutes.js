import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { listConversations, getConversation, askQuestion, deleteConversation } from '../controllers/chatController.js';

const router = Router();

router.use(protect);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/ask', askQuestion);

export default router;

