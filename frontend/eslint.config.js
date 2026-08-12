// ESLint flat config（eslint B1 / 维护态批13 / Sprint-38）
// 设计依据：docs/research/2026-08-12-frontend-eslint-b1-assessment.md
// - 用 typescript-eslint recommended（非 type-checked），避免与 tsconfig strict 的 tsc 类型检查重叠
// - 聚焦 tsc 管不到的：react-hooks 规则（项目大量自定义 hook，高价值）+ 显式 any + 未使用变量
// - tsconfig noUnusedLocals 未开 → no-unused-vars 补；noImplicitAny 在 strict 里但只拦隐式 any → no-explicit-any 补显式
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // project-rules §5.1「前端禁 any」机器守护（存量 1 个 any 债先 warn，Slice B 整治）
      '@typescript-eslint/no-explicit-any': 'warn',
      // tsconfig noUnusedLocals 未开 → eslint 补；_ 前缀参数忽略
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // rules-of-hooks 真 bug = error；exhaustive-deps 先 warn 观察（项目 hook 多，首跑可能较多）
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
];
