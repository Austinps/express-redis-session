import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import morgan from 'morgan';

import rateLimit from 'express-rate-limit';

import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { v4 as uuid } from 'uuid';
import config from '../config/config.js';
import {
  handleForgottenPassword,
  handleLogin,
  handleLogout,
  handleRegistration,
} from './controllers/authController.js';
import {
  renderForgotPassword,
  renderForgotPasswordSuccess,
  renderHome,
  renderLogin,
  renderProtected,
  renderRegistration,
} from './controllers/viewController.js';
dotenv.config();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
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
  prefix: 'express-session-redis:',
  ttl: 86400, // session will expire after 24 hours
});

// Initialize session storage.
app.use(
  session({
    store: redisStore,
    resave: false, // required: force lightweight session keep alive (touch)
    saveUninitialized: false, // recommended: only save session when data exists
    secret: process.env.SESSION_SECRET,
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

app.get('/forgot-password', renderForgotPassword);

app.get('/forgot-password-success', renderForgotPasswordSuccess);
app.get('/signup', renderRegistration);
app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/protected', renderProtected);

app.post('/logout', handleLogout);
app.post('/forgot-password', handleForgottenPassword);
app.post('/signup', handleRegistration);
app.post('/login', handleLogin);

app.post('/update-checkbox', (req, res) => {
  const { user } = req.session;
  const checkboxState = req.body.checkboxState;
  // Save the checkbox state
  // Your code here

  if (!user) {
    return res.redirect('/login');
  }

  if (!checkboxState) {
    return res.render('protected', {
      user,
      message: 'Please accept the terms and conditions.',
    });
  }

  // Render the protected page
  res.redirect('/protected');
});

export default app;
