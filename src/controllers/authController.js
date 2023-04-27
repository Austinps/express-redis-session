import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from 'firebase/auth';
import Joi from 'joi';
import { auth } from '../db/initFirebase.js';

// Define validation schema
const schema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

export const handleForgottenPassword = async (req, res) => {
  const { email } = req.body;
  try {
    await sendPasswordResetEmail(auth, email);
    res.redirect('/forgot-password-success');
  } catch (error) {
    console.log(error);
    if (error.code === 'auth/user-not-found') {
      req.session.userNotFound = true;
    } else {
      req.session.errorMessage = 'Error';
    }
    res.redirect('/forgot-password');
  }
};

export const handleRegistration = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  const { email, password } = value;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    // Check if user already exists
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    console.log(signInMethods);
    if (signInMethods.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // The user is signed up
    console.log(userCredential.user);
    req.session.user = { email: userCredential.user.email };
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Error creating user' });
  }
};

export const handleLogin = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  const { email, password } = value;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    // Check user credentials with Firebase authentication
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    // The user is logged in
    req.session.user = { email: userCredential.user.email };
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

export const handleLogout = (req, res) => {
  // Destroy session
  req.session.destroy();
  res.redirect('/');
};
