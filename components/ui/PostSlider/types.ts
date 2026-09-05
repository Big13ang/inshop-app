export interface PostSliderItem {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
}

export interface PostSliderProps {
  items: PostSliderItem[];
  activeSlide?: number;
  onSlideChange?: (index: number) => void;
  objectFit?: 'cover' | 'contain';
}
