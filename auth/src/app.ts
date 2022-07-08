import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';

// Routes
import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';

// Errors
import { errorHandler, NotFoundError } from '@ticketing-umer/common';

const app = express();
// traffic is being proxy to our server through ingress nginx, and trust the proxies
app.set('trust proxy', true);
app.use(express.json());

// jest automatically set the env to 'test'
const isSecure = process.env.NODE_ENV !== 'test';
// "signed": don't encrypt this
// "secure": only set cookies on https
app.use(cookieSession({ signed: false, secure: isSecure }));

// Routes
app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);

app.all('*', (req, res) => {
  const errMsg = `'${req.method}: ${req.originalUrl}' does not found on this server`;
  throw new NotFoundError(errMsg);
});

// Error Handler middleware
app.use(errorHandler);

export { app };
