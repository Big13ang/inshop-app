// Configure React 19 act environment for all component test renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expect = (globalThis as any).expect;
