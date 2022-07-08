import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';

// Errors
import {
  errorHandler,
  NotFoundError,
  currentUser,
} from '@ticketing-umer/common';

// Routes
import { createTicketRouter } from './routes/new';
import { showTicketRouter } from './routes/show';
import { indexTicketRouter } from './routes';
import { updateTicketRouter } from './routes/update';

const app = express();
// traffic is being proxy to our server through ingress nginx, and trust the proxies
app.set('trust proxy', true);
app.use(express.json());

// jest automatically set the env to 'test'
const isSecure = process.env.NODE_ENV !== 'test';
// "signed": don't encrypt this
// "secure": only set cookies on https
app.use(cookieSession({ signed: false, secure: isSecure }));

app.use(currentUser);

// Routes
app.use(indexTicketRouter);
app.use(showTicketRouter);
app.use(createTicketRouter);
app.use(updateTicketRouter);

app.all('*', (req, res) => {
  const errMsg = `'${req.method}: ${req.originalUrl}' does not found on this server`;
  throw new NotFoundError(errMsg);
});

// Error Handler middleware
app.use(errorHandler);

export { app };
