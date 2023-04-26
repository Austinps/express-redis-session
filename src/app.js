import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import { v4 as uuid } from 'uuid';
import config from '../config/config.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const { paths, viewEngine } = config;
app.set('views', paths.views);
app.set('view engine', viewEngine);
app.use(express.static(paths.public));
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
app.use(function (req, res, next) {
  if (!req.session.fingerprint) {
    req.session.fingerprint = {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };
  }
  next();
});

// Login route
app.post('/login', (req, res) => {
  // Check user credentials
  console.log(req.body);
  if (req.body.username === 'user' && req.body.password === 'pass') {
    // Store user info in session
    req.session.user = { username: 'user' };
    res.redirect('/protected');
  } else {
    res.send('Login failed');
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
    res.render('login');
  }
});

// Login route
app.post('/login', (req, res) => {
  // Check user credentials
  console.log(req.body);
  if (req.body.username === 'user' && req.body.password === 'pass') {
    // Store user info in session
    req.session.user = { username: 'user' };
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
