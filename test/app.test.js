// test/app.test.js

import test from 'ava';
import request from 'supertest';
import app from '../src/app.js';

test('GET / should return 200', async (t) => {
  const res = await request(app).get('/');
  t.is(res.status, 200);
});

test('GET /login should return 200', async (t) => {
  const res = await request(app).get('/login');
  t.is(res.status, 200);
});

test('GET /protected should redirect to /login', async (t) => {
  const res = await request(app).get('/protected');
  t.is(res.status, 302);
  t.is(res.headers.location, '/login');
});

test('GET /forgot-password should return 200', async (t) => {
  const res = await request(app).get('/forgot-password');
  t.is(res.status, 200);
});
