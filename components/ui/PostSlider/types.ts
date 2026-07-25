export interface PostSliderItem {
  url: string;
  alt?: string;
}

export interface PostSliderProps {
  items: PostSliderItem[];
  activeSlide?: number;
  onSlideChange?: (index: number) => void;
  objectFit?: 'cover' | 'contain';
}
