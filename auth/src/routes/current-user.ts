import express from 'express';
import { currentUser } from '@ticketing-umer/common';

const router = express.Router();

// this is for client to figure out that if user is signed in or not, by sending cookie, that has json web token
router.get('/api/users/currentuser', currentUser, (req, res) => {
  // whenever we didn't specify the status, the default is 200
  res.send({ currentUser: req.currentUser || null });
});

export { router as currentUserRouter };
