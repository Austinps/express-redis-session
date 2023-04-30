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

app.get('/forgot-password', renderForgotPassword);

app.get('/forgot-password-success', renderForgotPasswordSuccess);
app.get('/signup', renderRegistration);
app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/protected', renderProtected);

export default router;
