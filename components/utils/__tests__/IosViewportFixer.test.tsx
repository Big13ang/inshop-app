import { render } from '@testing-library/react';
import IosViewportFixer from '../IosViewportFixer';

describe('IosViewportFixer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders null and registers focusout listener', () => {
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });

    const { unmount } = render(<IosViewportFixer />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('focusout', expect.any(Function));

    const focusOutEvent = new FocusEvent('focusout', { bubbles: true });
    const input = document.createElement('input');
    Object.defineProperty(focusOutEvent, 'target', { value: input, enumerable: true });

    window.dispatchEvent(focusOutEvent);
    jest.advanceTimersByTime(100);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });

    scrollToSpy.mockClear();

    // Verify focusout moving focus to another input does NOT trigger scroll reset
    const focusOutEventToInput = new FocusEvent('focusout', { bubbles: true });
    const nextInput = document.createElement('input');
    Object.defineProperty(focusOutEventToInput, 'target', { value: input, enumerable: true });
    Object.defineProperty(focusOutEventToInput, 'relatedTarget', { value: nextInput, enumerable: true });

    window.dispatchEvent(focusOutEventToInput);
    jest.advanceTimersByTime(100);

    expect(scrollToSpy).not.toHaveBeenCalled();

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focusout', expect.any(Function));

    scrollToSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
