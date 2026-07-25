# Accessibility (a11y)

This app follows basic accessibility practices so that keyboard and screen-reader users can use the panel.

## What’s in place

- **Form controls**: `Input`, `Select`, and `Checkbox` use proper `id`/`htmlFor` so labels are associated. You can pass an `id` prop to avoid duplicate IDs when the same control is used more than once on a page.
- **Modals**: `Modal` and `TempPasswordModal` use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`. Press **Escape** to close.
- **Tabs**: Tab list uses `role="tablist"`; each tab has `role="tab"`, `aria-selected`, and `tabIndex` for keyboard navigation. Pass `label` for an accessible name (e.g. `label="Admin sections"`).
- **MultiSelectBox**: Options are keyboard-activatable (`role="button"`, `tabIndex={0}`, Enter/Space); the group has `aria-labelledby`.
- **Focus**: Interactive elements use visible focus styles (ring/border). Avoid removing `focus:ring-*` or `focus:outline-none` without providing a visible alternative.

## ESLint (jsx-a11y)

To catch common a11y issues in JSX, install and enable `eslint-plugin-jsx-a11y`:

```bash
npm install -D eslint eslint-plugin-jsx-a11y eslint-plugin-react eslint-plugin-react-hooks @eslint/js typescript-eslint
```

Then extend your ESLint config with the a11y rules (e.g. in `eslint.config.js` or `.eslintrc.cjs`). Example for flat config:

```js
import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  {
    plugins: { 'jsx-a11y': jsxA11y, react, 'react-hooks': reactHooks },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    settings: { react: { version: 'detect' } },
  },
);
```

## Testing

- **Manual**: Use the app with only the keyboard (Tab, Enter, Space, Escape). Test with a screen reader (e.g. VoiceOver on macOS, NVDA on Windows).
- **Lighthouse**: Run an accessibility audit in Chrome DevTools (Lighthouse tab) against the built app (`npm run build && npm run preview`).
- **axe**: For automated checks, you can add `@axe-core/react` in development or run `axe-core` in a test (e.g. with Vitest and jsdom).

## Tips

- Prefer semantic HTML (`<button>`, `<label>`, `<main>`, `<nav>`) and add ARIA only when needed.
- Ensure sufficient color contrast (text and focus indicators) against the background.
- When adding new modals or dialogs, keep Escape-to-close and consider focusing the first focusable element when the modal opens.
