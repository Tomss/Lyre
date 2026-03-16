import dotenv from 'dotenv';
dotenv.config();
import { sendActivationEmail } from './server/utils/email.ts';

async function test() {
  console.log("Testing email with host:", process.env.EMAIL_HOST, "port:", process.env.EMAIL_PORT);
  const start = Date.now();
  const success = await sendActivationEmail('test@lalyre.fr', 'Test User', 'abc123token');
  console.log('Success:', success, 'Took:', Date.now() - start, 'ms');
  process.exit(0);
}
test();
