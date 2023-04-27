# User Session Management between Redis and Firebase

This project is an implementation exercise showcasing user session management between Redis and Firebase using Express. It provides a code snippet for a Node.js application that uses Firebase for user authentication and Redis for session storage. The app incorporates several security features to protect against common web application vulnerabilities such as session hijacking, brute-force attacks, and input validation. Some notable features include:

- Redis Store: Redis is used as a session store to persist session data across requests. The Redis store is configured to delete expired keys automatically, and it's known for its high performance and security.
- Secure Session Cookie: The session cookie is set to httpOnly and secure, preventing client-side scripts from accessing the cookie and ensuring that the cookie is only sent over HTTPS connections in production environments.
- Session Fingerprinting: The app uses a middleware to create a session fingerprint that includes the client's IP address and user agent, which helps detect session hijacking attacks.
- Input Validation: The app uses the Joi library to validate user input for the login and signup forms.
- Firebase Authentication: Firebase Authentication is used to handle user authentication, which provides a secure way to authenticate users with email and password.
- Rate Limiting: express-rate-limit middleware is used to limit the number of requests that can be made in a certain period to prevent brute-force attacks.

## Requirements

Node.js
Redis server
Firebase account
Installation
Clone the repository:
bash

git clone https://github.com/<USERNAME>/<REPO-NAME>.git

Create a .env file with the following variables:
makefile

API_KEY=<YOUR_FIREBASE_API_KEY>
AUTH_DOMAIN=<YOUR_FIREBASE_AUTH_DOMAIN>
PROJECT_ID=<YOUR_FIREBASE_PROJECT_ID>
STORAGE_BUCKET=<YOUR_FIREBASE_STORAGE_BUCKET>
MESSAGING_SENDER_ID=<YOUR_FIREBASE_MESSAGING_SENDER_ID>
APP_ID=<YOUR_FIREBASE_APP_ID>

npm run dev
