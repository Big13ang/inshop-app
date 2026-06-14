export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface PostSliderProps {
  images?: string[];
  media?: MediaItem[];
  activeSlide?: number;
  onSlideChange?: (index: number) => void;
  objectFit?: 'cover' | 'contain';
}
