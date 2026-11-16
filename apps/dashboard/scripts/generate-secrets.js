import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const secretsPath = path.resolve(__dirname, '../secrets.json');

try {
  if (!fs.existsSync(envPath)) {
    console.error(`Error: .env file not found at ${envPath}`);
    process.exit(1);
  }

  // Read and parse the .env file into a JSON object
  const envConfig = dotenv.parse(fs.readFileSync(envPath));

  // Write the object to secrets.json with nice formatting
  fs.writeFileSync(secretsPath, JSON.stringify(envConfig, null, 2));

  console.log(`Successfully extracted ${Object.keys(envConfig).length} secrets to secrets.json!`);
  console.log('You can now run: npx wrangler secret bulk secrets.json');
} catch (error) {
  console.error('Error generating secrets.json:', error.message);
}
