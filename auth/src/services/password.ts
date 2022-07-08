import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class Password {
  static async toHash(password: string): Promise<string> {
    // random string
    const salt = randomBytes(8).toString('hex');
    // hash te password using salt
    const buffer = (await scryptAsync(password, salt, 64)) as Buffer;

    // return hashed password along with salt
    return `${buffer.toString('hex')}.${salt}`;
  }

  // stored password is the hashed password and salt joined by period "."
  static async compare(
    storedPassword: string,
    suppliedPassword: string
  ): Promise<boolean> {
    const [hashedPassword, salt] = storedPassword.split('.');
    // use the salt that was created in toHash function, to generate this hashed password
    // if user has hashed password, outside of our string, without the salt (or different salt), supplied (hashed), and hashed password will not be same
    const buffer = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    return buffer.toString('hex') === hashedPassword;
  }
}
