import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
  // default username / password on init
  env: {
    vision_user: 'admin',
    vision_password: 'sigma',
    vision_user_id: 'vision_admin_user_id',
  },
});
