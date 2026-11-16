import dotenv from 'dotenv';
import { resolve as pathResolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load root .env (two levels up from apps/dashboard)
dotenv.config({ path: pathResolve(__dirname, '../../.env') });

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

const sharedPlugins = [
  resolve({ browser: true }),
  commonjs(),
  terser({ compress: { evaluate: false } }),
];

export default [
  {
    input: 'src/tracker/index.js',
    output: {
      file: 'public/script.js',
      format: 'iife',
    },
    plugins: [
      ...sharedPlugins,
      replace({
        __COLLECT_API_HOST__: process.env.COLLECT_API_HOST || '',
        __COLLECT_API_ENDPOINT__: process.env.COLLECT_API_ENDPOINT || '/send',
        __COLLECT_REPLAY_ENDPOINT__: process.env.COLLECT_REPLAY_ENDPOINT || '/record',
        delimiters: ['', ''],
        preventAssignment: true,
      }),
    ],
  },{
    input: 'src/tracker/recorder.js',
    output: {
      file: 'public/recorder.js',
      format: 'iife',
    },
    plugins: [...sharedPlugins],
  },
];
