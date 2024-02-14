module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:solid/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['solid'],
  rules: {
   'no-unused-vars': [
      'warn',
      { vars: 'local', "argsIgnorePattern":"^_", "varsIgnorePattern": "^_" }
    ]
  },
}
