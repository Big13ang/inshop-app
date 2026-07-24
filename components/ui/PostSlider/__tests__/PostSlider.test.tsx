import { render } from '@testing-library/react';
import PostSlider from '../index';

const mockUpdate = jest.fn();
const mockMoveToIdx = jest.fn();

const mockSliderInstance = {
  update: mockUpdate,
  moveToIdx: mockMoveToIdx,
  prev: jest.fn(),
  next: jest.fn(),
  track: {
    details: {
      rel: 0,
    },
  },
};

let mockOptionsCalls: { initial?: number }[] = [];

jest.mock('keen-slider/react', () => ({
  useKeenSlider: jest.fn((options: { initial?: number }) => {
    mockOptionsCalls.push(options);
    return [jest.fn(), { current: mockSliderInstance }];
  }),
}));

describe('PostSlider - Stability and Flashing Prevention Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOptionsCalls = [];
    mockSliderInstance.track.details.rel = 0;
  });

  it('keeps options initial parameter constant across renders to prevent Keen-Slider internal resets', () => {
    const items = [{ url: 'img1.jpg' }, { url: 'img2.jpg' }];

    // 1. Render initially with activeSlide = 0
    const { rerender } = render(
      <PostSlider items={items} activeSlide={0} />
    );

    expect(mockOptionsCalls).toHaveLength(1);
    expect(mockOptionsCalls[0].initial).toBe(0);

    // 2. Re-render with activeSlide = 1 (simulating slide navigation)
    rerender(<PostSlider items={items} activeSlide={1} />);

    // Since we stabilized 'initial' using useState, the options passed to useKeenSlider should not change
    expect(mockOptionsCalls).toHaveLength(2);
    expect(mockOptionsCalls[1].initial).toBe(0); // must remain 0!
  });

  it('does NOT call instance.update() when only activeSlide changes', () => {
    const items = [{ url: 'img1.jpg' }, { url: 'img2.jpg' }];
    const { rerender } = render(
      <PostSlider items={items} activeSlide={0} />
    );

    mockUpdate.mockClear();

    // Change activeSlide (navigate to slide 1)
    rerender(<PostSlider items={items} activeSlide={1} />);

    // instance.update() should NOT have been called because media/images didn't change
    expect(mockUpdate).not.toHaveBeenCalled();
    // moveToIdx should be called to navigate to slide 1
    expect(mockMoveToIdx).toHaveBeenCalledWith(1);
  });

  it('calls instance.update(undefined, activeSlide) when media items actually change to preserve slide index', () => {
    const initialItems = [{ url: 'img1.jpg' }, { url: 'img2.jpg' }];
    const { rerender } = render(
      <PostSlider items={initialItems} activeSlide={1} />
    );

    mockUpdate.mockClear();

    // Add a new image (simulate changes in upload list)
    const newItems = [{ url: 'img1.jpg' }, { url: 'img2.jpg' }, { url: 'img3.jpg' }];
    rerender(<PostSlider items={newItems} activeSlide={1} />);

    // instance.update should be called since URLs list changed
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    // It must pass the current active slide index (1) as the second argument to prevent track resets to 0
    expect(mockUpdate).toHaveBeenCalledWith(undefined, 1);
  });
});
