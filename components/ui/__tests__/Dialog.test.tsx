import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogOverlay } from '../Dialog';

jest.mock('gsap', () => ({
  __esModule: true,
  default: {
    to: jest.fn(),
    set: jest.fn(),
    killTweensOf: jest.fn(),
  },
}));

import gsap from 'gsap';

describe('Dialog', () => {
  it('kills the backdrop tween when the overlay unmounts mid-animation', () => {
    const { unmount } = render(
      <Dialog.Root isOpen onClose={jest.fn()}>
        <DialogOverlay />
      </Dialog.Root>,
    );

    unmount();

    expect(gsap.killTweensOf).toHaveBeenCalled();
  });

  it('kills the content tween when the dialog unmounts mid-animation', () => {
    const { unmount } = render(
      <Dialog.Root isOpen onClose={jest.fn()}>
        <DialogContent variant="center">content</DialogContent>
      </Dialog.Root>,
    );

    unmount();

    expect(gsap.killTweensOf).toHaveBeenCalled();
  });
});
