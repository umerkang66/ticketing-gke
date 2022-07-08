jest.setTimeout(100000);

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
  var getAuthCookie: () => string[];
}

jest.mock('../nats-wrapper');

// Before all our different test startups (different test files), we're going to create a new instance of this mongo memory server
let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_KEY = 'asdf';

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

beforeEach(async () => {
  // reinitialize the every mock functions before every test
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});

global.getAuthCookie = () => {
  // Build a JWT payload. {id,email}
  const payload = {
    // create new id every time
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build the session obj. {jwt: MY_JWT}
  const session = { jwt: token };

  // Turn that session obj into JSON
  const sessionJson = JSON.stringify(session);
  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJson).toString('base64');

  // // return a string thats the cookie with the encoded data
  // // cookies are sent in array format for supertest

  return [`session=${base64}`];
};
