import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      'src/workflow/extractor/video-generator/video-template.html',
      'src/types/*',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('plugin:prettier/recommended'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
