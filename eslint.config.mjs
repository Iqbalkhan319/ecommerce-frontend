import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/coverage/**', '**/next-env.d.ts', '**/*.js', '**/*.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/**/*'],
    rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' },
  },
);
