import { MediaKind } from '../types';

export interface ValidationResult {
  valid: File[];
  rejected: Array<{ file: File; reason: string }>;
}

const IMAGE_RULES = {
  mimes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  maxBytes: 10 * 1024 * 1024,
  mimeError: 'فرمت نامعتبر — فقط JPG، PNG و WebP مجاز است',
  sizeError: 'حجم عکس نباید بیشتر از ۱۰ مگابایت باشد',
};

const VIDEO_RULES = {
  mimes: new Set(['video/mp4', 'video/webm', 'video/quicktime']),
  maxBytes: 500 * 1024 * 1024,
  mimeError: 'فرمت ویدیو نامعتبر — فقط MP4، WebM و MOV مجاز است',
  sizeError: 'حجم ویدیو نباید بیشتر از ۵۰۰ مگابایت باشد',
};

function validateOne(file: File, kind: MediaKind): string | null {
  const rules = kind === 'video' ? VIDEO_RULES : IMAGE_RULES;
  if (!rules.mimes.has(file.type)) return rules.mimeError;
  if (file.size > rules.maxBytes) return rules.sizeError;
  return null;
}

export function validateBatch(files: File[], kind: MediaKind = 'image'): ValidationResult {
  const valid: File[] = [];
  const rejected: Array<{ file: File; reason: string }> = [];

  for (const file of files) {
    const err = validateOne(file, kind);
    if (err) rejected.push({ file, reason: err });
    else valid.push(file);
  }

  return { valid, rejected };
}
