import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import 'firebase/database'; // Import additional Firebase services if needed
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { v4 as uuid } from 'uuid';
import config from '../config/config.js';
dotenv.config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { paths, viewEngine } = config;
app.set('views', paths.views);
app.set('view engine', viewEngine);
app.use(express.static(paths.public));
// Apply the rate limiter to all routes
app.use(limiter);
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Enable keyspace notifications
redisClient.sendCommand(
  ['config', 'set', 'notify-keyspace-events', 'Ex'],
  (err, reply) => {
    if (err) {
      console.log(err);
    } else {
      console.log(reply);
    }
  }
);

// Create separate Redis client for subscribing to channels
const redisSubClient = createClient();
redisSubClient.subscribe('__keyevent@0__:expired');

// Listen for expired key notifications
redisSubClient.on('message', (channel, message) => {
  if (channel === '__keyevent@0__:expired') {
    // Delete expired key from Redis store
    redisClient.del(message);
  }
});

// Initialize store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: 'express-session:',
  ttl: 86400, // session will expire after 24 hours
});

// Initialize session storage.
app.use(
  session({
    store: redisStore,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: 'keyboard cat',
    genid: function (req) {
      // Generate new session ID on each request
      return uuid();
    },
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // use secure cookies in production
      sameSite: 'strict', // set SameSite to strict to prevent CSRF attacks
    },
  })
);

// Session fingerprinting middleware
app.use(function (req, r_, next) {
  if (!req.session.fingerprint) {
    req.session.fingerprint = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }
  next();
});

// Define validation schema
const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
// signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Route for creating a new user
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // The user is signed up
    console.log(userCredential.user);
    req.session.user = { email: userCredential.user.email };
    res.redirect('/protected');
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error' });
  }
});

// Route for logging in a user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { error } = schema.validate(req.body);

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
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Home view
app.get('/', (req, res) => {
  if (req.session.user) {
    // User is logged in, show logout link
    res.render('index', { loggedIn: true, user: req.session.user });
  } else {
    // User is not logged in, show login link
    res.render('index', { loggedIn: false });
  }
});

// Login view
app.get('/login', (req, res) => {
  // Check if user is already logged in
  if (req.session.user) {
    res.redirect('/protected');
  } else {
    // Generate a new CSRF token and store it in the session
    const csrfToken = uuid();
    req.session.csrfToken = csrfToken;

    // Render the login page with the CSRF token as a cookie
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.render('login');
  }
});

// Login route
app.post('/login', (req, res) => {
  if (req.body.csrfToken !== req.session.csrfToken) {
    res.status(403).send('CSRF token mismatch');
    return;
  }
  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    res.status(400).send(`Validation error: ${error.message}`);
    return;
  }
  // Check user credentials
  const { username, password } = value;
  if (username === 'user' && password === 'pass') {
    // Store user info in session
    // Store user data in session
    req.session.user = { id: user.id, username: user.username };
    res.redirect('/');
  } else {
    res.send('Login failed');
  }
});

// Protected route
app.get('/protected', (req, res) => {
  // Check if user is logged in and session fingerprint matches
  if (
    req.session.user &&
    req.session.fingerprint.ip === req.ip &&
    req.session.fingerprint.userAgent === req.headers['user-agent']
  ) {
    res.render('protected', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy();
  res.redirect('/');
});

export default app;
