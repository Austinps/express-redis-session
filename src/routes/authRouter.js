// /routes/authRouter.js
import { Router } from 'express';

import {
  handleForgottenPassword,
  handleLogin,
  handleLogout,
  handleRegistration,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', handleLogin);
router.post('/signup', handleRegistration);
router.post('/logout', handleLogout);
router.post('/forgot-password', handleForgottenPassword);

export default router;
