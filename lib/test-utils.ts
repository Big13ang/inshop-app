// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

export const isMutationTest = process.env.MUTATION_TEST === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const exp = (globalThis as any).expect;

exp?.extend({
  toBeToggled(el: HTMLElement, expected = true) {
    const isToggled =
      el?.getAttribute('aria-pressed') === 'true' ||
      el?.getAttribute('aria-checked') === 'true' ||
      el?.getAttribute('aria-expanded') === 'true' ||
      ['checked', 'open', 'on', 'active', 'true'].includes(el?.getAttribute('data-state') ?? '') ||
      (el as HTMLInputElement)?.checked === true;

    return {
      pass: isToggled === expected,
      message: () => `expected element ${expected ? '' : 'not '}to be toggled`,
    };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expect = Object.assign((...args: any[]) => exp(...args), exp, {
  isMutation: isMutationTest,
  isMutationTest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;
