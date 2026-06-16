export const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

import { text } from '../constants';

export function validateImageFile(file: File): string | null {
  if (!IMAGE_MIME.has(file.type)) return text.alertInvalidImageFormat;
  if (file.size > MAX_IMAGE_BYTES) return text.alertImageTooLarge;
  return null;
}
