// /test/authController.test.js

import { mockDeep } from 'jest-mock-extended';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from 'firebase/auth';
import Joi from 'joi';
import { auth } from '../db/initFirebase.js';
import {
  handleForgottenPassword,
  handleRegistration,
  handleLogin,
  handleLogout,
} from './authController.js';

// Mock the Firebase auth module
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  fetchSignInMethodsForEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe('Auth Controller', () => {
  describe('handleForgottenPassword', () => {
    test('sends password reset email and redirects to success page', async () => {
      // Arrange
      const req = { body: { email: 'test@example.com' } };
      const res = mockDeep({ redirect: jest.fn() });
      sendPasswordResetEmail.mockResolvedValue();

      // Act
      await handleForgottenPassword(req, res);

      // Assert
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(res.redirect).toHaveBeenCalledWith('/forgot-password-success');
    });

    test('handles user not found error and redirects to forgot password page', async () => {
      // Arrange
      const req = { body: { email: 'nonexistent@example.com' } };
      const res = mockDeep({ redirect: jest.fn() });
      const error = new Error();
      error.code = 'auth/user-not-found';
      sendPasswordResetEmail.mockRejectedValue(error);

      // Act
      await handleForgottenPassword(req, res);

      // Assert
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'nonexistent@example.com');
      expect(req.session.userNotFound).toBe(true);
      expect(res.redirect).toHaveBeenCalledWith('/forgot-password');
    });

    test('handles other errors and redirects to forgot password page', async () => {
      // Arrange
      const req = { body: { email: 'test@example.com' } };
      const res = mockDeep({ redirect: jest.fn() });
      const error = new Error();
      sendPasswordResetEmail.mockRejectedValue(error);

      // Act
      await handleForgottenPassword(req, res);

      // Assert
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(req.session.errorMessage).toBe('Error');
      expect(res.redirect).toHaveBeenCalledWith('/forgot-password');
    });
  });

  describe('handleRegistration', () => {
    test('creates new user and redirects to success page', async () => {
      // Arrange
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
      fetchSignInMethodsForEmail.mockResolvedValue([]);
      createUserWithEmailAndPassword.mockResolvedValue({ user: { email: 'test@example.com' } });

      // Act
      await handleRegistration(req, res);

      // Assert
      expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'test@example.com');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(req.session.user).toEqual({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Success' });
    });

    test('returns error if user already exists', async () => {
      // Arrange
      const 
req = { body: { email: 'existinguser@example.com', password: 'password123' } };
const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const error = new Error();
error.code = 'auth/email-already-in-use';
fetchSignInMethodsForEmail.mockResolvedValue(['password']);
createUserWithEmailAndPassword.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'existinguser@example.com');
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'existinguser@example.com', 'password123');
  expect(req.session.errorMessage).toBe('Email already in use');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
});

test('returns error if email is invalid', async () => {
  // Arrange
  const req = { body: { email: 'invalidemail', password: 'password123' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const error = new Error();
  error.code = 'auth/invalid-email';
  fetchSignInMethodsForEmail.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'invalidemail');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(req.session.errorMessage).toBe('Invalid email address');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email address' });
});

test('returns error if password is too weak', async () => {
  // Arrange
  const req = { body: { email: 'test@example.com', password: 'weak' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const error = new Error();
  error.code = 'auth/weak-password';
  fetchSignInMethodsForEmail.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'test@example.com');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(req.session.errorMessage).toBe('Password is too weak');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Password is too weak' });
});

test('returns error if validation fails', async () => {
  // Arrange
  const req = { body: { email: 'test@example.com', password: '' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).not.toHaveBeenCalled();
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(req.session.errorMessage).toBe('Validation failed');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Validation failed' });
});
});

describe('handleLogin', () => {
test('logs user in and redirects to dashboard page', async () => {
// Arrange
const req = { body: { email: 'test@example.com', password: 'password123' } };
const res = mockDeep({ redirect: jest.fn() });
fetchSignInMethodsForEmail.mockResolvedValue(['password']);
signInWithEmailAndPassword.mockResolvedValue();
  // Act
  await handleLogin(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth,

describe('handleRegistration', () => {
test('creates new user and redirects to success page', async () => {
// Arrange
const req = { body: { email: 'test@example.com', password: 'password123' } };
const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
fetchSignInMethodsForEmail.mockResolvedValue([]);
createUserWithEmailAndPassword.mockResolvedValue({ user: { email: 'test@example.com' } });

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'test@example.com');
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
  expect(req.session.user).toEqual({ email: 'test@example.com' });
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({ message: 'Success' });
});

test('returns error if user already exists', async () => {
  // Arrange
  const req = { body: { email: 'existinguser@example.com', password: 'password123' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const error = new Error();
  error.code = 'auth/email-already-in-use';
  fetchSignInMethodsForEmail.mockResolvedValue(['password']);
  createUserWithEmailAndPassword.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'existinguser@example.com');
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'existinguser@example.com', 'password123');
  expect(req.session.errorMessage).toBe('Email already in use');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Email already in use' });
});

test('returns error if email is invalid', async () => {
  // Arrange
  const req = { body: { email: 'invalidemail', password: 'password123' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const error = new Error();
  error.code = 'auth/invalid-email';
  fetchSignInMethodsForEmail.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'invalidemail');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(req.session.errorMessage).toBe('Invalid email address');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email address' });
});

test('returns error if password is too weak', async () => {
  // Arrange
  const req = { body: { email: 'test@example.com', password: 'weak' } };
  const res = mockDeep({ status: jest.fn().mockReturnThis(), json: jest.fn() });
  const error = new Error();
  error.code = 'auth/weak-password';
  fetchSignInMethodsForEmail.mockRejectedValue(error);

  // Act
  await handleRegistration(req, res);

  // Assert
  expect(fetchSignInMethodsForEmail).toHaveBeenCalledWith(auth, 'test@example.com');
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(req.session.errorMessage).toBe('Password is too weak');
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Password is too weak' });
});

test('returns error if validation fails', async () => {
  // Arrange
  const req = { body: { email: 'invalidemail', password: 'weak'}}});

describe('Auth Controller', () => {
describe('handleLogin', () => {
test('logs in existing user and redirects to dashboard', async () => {
// Arrange
const req = { body: { email: 'test@example.com', password: 'password123' } };
const res = mockDeep({ redirect: jest.fn() });
signInWithEmailAndPassword.mockResolvedValue({ user: { email: 'test@example.com' } });

  // Act
  await handleLogin(req, res);

  // Assert
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
  expect(req.session.user).toEqual({ email: 'test@example.com' });
  expect(res.redirect).toHaveBeenCalledWith('/dashboard');
});

test('handles invalid email and redirects to login page', async () => {
  // Arrange
  const req = { body: { email: 'invalidemail', password: 'password123' } };
  const res = mockDeep({ redirect: jest.fn() });
  const error = new Error();
  error.code = 'auth/invalid-email';
  signInWithEmailAndPassword.mockRejectedValue(error);

  // Act
  await handleLogin(req, res);

  // Assert
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'invalidemail', 'password123');
  expect(req.session.errorMessage).toBe('Invalid email address');
  expect(res.redirect).toHaveBeenCalledWith('/login');
});

test('handles user not found and redirects to login page', async () => {
  // Arrange
  const req = { body: { email: 'nonexistent@example.com', password: 'password123' } };
  const res = mockDeep({ redirect: jest.fn() });
  const error = new Error();
  error.code = 'auth/user-not-found';
  signInWithEmailAndPassword.mockRejectedValue(error);

  // Act
  await handleLogin(req, res);

  // Assert
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'nonexistent@example.com', 'password123');
  expect(req.session.userNotFound).toBe(true);
  expect(res.redirect).toHaveBeenCalledWith('/login');
});

test('handles wrong password and redirects to login page', async () => {
  // Arrange
  const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
  const res = mockDeep({ redirect: jest.fn() });
  const error = new Error();
  error.code = 'auth/wrong-password';
  signInWithEmailAndPassword.mockRejectedValue(error);

  // Act
  await handleLogin(req, res);

  // Assert
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'wrongpassword');
  expect(req.session.errorMessage).toBe('Incorrect password');
  expect(res.redirect).toHaveBeenCalledWith('/login');
});
});

describe('handleLogout', () => {
test('logs out user and redirects to home page', async () => {
// Arrange
const req = {};
const res = mockDeep({ redirect: jest.fn() });  // Act
  await handleLogout(req, res);

  // Assert
  expect(req.session.user).toBeUndefined();
  expect(res.redirect).toHaveBeenCalledWith('/');
});
});
