import express from 'express'
const router = express.Router()
import { register,login,me } from '../controllers/AuthController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

//Auth routes
router.post('/auth/register',register);
router.post('/auth/login',login);
router.post('/auth/me',authenticate,me);

export default router;