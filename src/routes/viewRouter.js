// /src/routes/viewRouter.js

import { Router } from 'express';
import {
  renderForgotPassword,
  renderForgotPasswordSuccess,
  renderHome,
  renderLogin,
  renderProtected,
  renderRegistration,
} from '../controllers/viewController.js';

const router = Router();

router.get('/forgot-password', renderForgotPassword);

router.get('/forgot-password-success', renderForgotPasswordSuccess);
router.get('/signup', renderRegistration);
router.get('/', renderHome);
router.get('/login', renderLogin);
router.get('/protected', renderProtected);

export default router;
