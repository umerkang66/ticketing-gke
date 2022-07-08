import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { BadRequestError, validateRequest } from '@ticketing-umer/common';

import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

const validator = [
  body('email')
    .isEmail()
    .withMessage('The email that you have provided must be valid'),
  body('password').trim().notEmpty().withMessage('You must provide a password'),
];

router.post(
  '/api/users/signin',
  validator,
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new BadRequestError('Invalid credentials');
    }

    const correctPassword = await Password.compare(user.password, password);

    if (!correctPassword) {
      throw new BadRequestError('Invalid credentials');
    }

    const secret = process.env.JWT_KEY!;
    const userJwt = jwt.sign({ id: user.id, email: user.email }, secret);
    req.session = { jwt: userJwt };

    res.status(200).send(user);
  }
);

export { router as signinRouter };
