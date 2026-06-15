/// <reference types="@testing-library/jest-dom" />
import { render } from '@testing-library/react';
import { SlideItem } from '../SlideItem';

describe('SlideItem - Stacking and Flicker Prevention Tests', () => {
  const item = { url: 'img1.jpg', type: 'image' as const };

  it('renders loading skeleton before the image in DOM order', () => {
    const { container } = render(
      <SlideItem
        item={item}
        idx={0}
        objectFit="cover"
      />
    );

    const skeleton = container.querySelector('#slide-skeleton-0');
    const img = container.querySelector('#slide-img-0');

    expect(skeleton).toBeInTheDocument();
    expect(img).toBeInTheDocument();

    // Find the children indices in the DOM container to assert order
    const children = Array.from(img?.parentElement?.children || []);
    const skeletonIdx = children.indexOf(skeleton!);
    const imgIdx = children.indexOf(img!);

    // Skeleton must be rendered BEFORE the image so the image overlays it
    expect(skeletonIdx).toBeLessThan(imgIdx);
  });

  it('applies z-10 class and overlays the skeleton to prevent layout flashes', () => {
    const { container } = render(
      <SlideItem
        item={item}
        idx={0}
        objectFit="cover"
      />
    );

    const img = container.querySelector('#slide-img-0');
    expect(img).toHaveClass('relative', 'z-10');
    // Verify it doesn't have opacity-0 or transition-opacity classes
    expect(img?.className).not.toContain('opacity-0');
    expect(img?.className).not.toContain('transition-opacity');
  });
});
