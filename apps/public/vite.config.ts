import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../../');
  const env = loadEnv(mode, envDir, ['VITE_', 'NEXT_PUBLIC_']);

  const dashboardUrl =
    env.NEXT_PUBLIC_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    '';

  return {
    plugins: [react()],
    envDir,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_DASHBOARD_URL': JSON.stringify(dashboardUrl),
    },
  };
});
