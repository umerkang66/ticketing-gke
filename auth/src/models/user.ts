import mongoose from 'mongoose';
import { Password } from '../services/password';

// interface to describe the properties that are required to create user
interface UserAttrs {
  email: string;
  password: string;
}

// interface that describes the properties that a user model has
interface UserModel extends mongoose.Model<UserDocument> {
  build(attrs: UserAttrs): UserDocument;
}

// interface that describes the properties that user document has
interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      // whenever JSON.stringify() will be called on document, this object will use this configs
      transform(doc, ret) {
        // after converting into plain obj, the object that is returned is "ret", we can modify that ret, it doesn't change the document in mongodb, but rather when it is turned into JSON by express
        ret.id = ret._id;

        delete ret._id;
        delete ret.__v;
        delete ret.password;
        // "or" ret.password = undefined
      },
    },
  }
);

// pre document middlewares
userSchema.pre('save', async function (done) {
  // here this is document
  if (this.isModified('password')) {
    // if password is not modified, go to next middleware, even if we creating the password first time, isModified will return true
    const hashed = await Password.toHash(this.get('password'));
    this.set('password', hashed);
  }
  done();
});

userSchema.statics.build = function (attrs: UserAttrs) {
  // here this is userModel
  return new User(attrs);
};

// first argument is the name of collection
const User = mongoose.model<UserDocument, UserModel>('users', userSchema);

export { User };
