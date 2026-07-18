import pLimit from 'p-limit';
import { type MediaKind } from '../types';
import { parseImageHeader, detectVideoFormat } from './headerParser';
import { ERROR_MESSAGES } from '@/lib/constants/errors';

export type RejectionCode = 'invalid_format' | 'file_too_large' | 'resolution_too_low' | 'heic_not_supported';

export interface Rejection {
  file: File;
  code: RejectionCode;
  reason: string;
}

export interface ValidationResult {
  valid: File[];
  rejected: Rejection[];
}

const IMAGE_RULES = {
  maxBytes: 10 * 1024 * 1024,
  mimeError: ERROR_MESSAGES.upload.imageFormatLimit,
  sizeError: ERROR_MESSAGES.upload.imageSizeLimit,
  resolutionError: 'حداقل وضوح ۷۸۰×۷۸۰ پیکسل است',
  heicError: 'فرمت HEIC پشتیبانی نمی‌شود — تنظیمات دوربین را به JPG تغییر دهید',
  animatedError: 'فرمت نامعتبر — فایل‌های متحرک WebP مجاز نیستند',
  readError: 'فرمت نامعتبر — فایل خوانده نمی‌شود',
};

const VIDEO_RULES = {
  maxBytes: 500 * 1024 * 1024,
  mimeError: ERROR_MESSAGES.upload.videoFormatLimit,
  sizeError: ERROR_MESSAGES.upload.videoSizeLimit,
};

async function validateOneAsync(file: File, kind: MediaKind): Promise<Rejection | null> {
  const isVideo = kind === 'video';
  const rules = isVideo ? VIDEO_RULES : IMAGE_RULES;

  // 1. Size check
  if (file.size > rules.maxBytes) {
    return {
      file,
      code: 'file_too_large',
      reason: rules.sizeError,
    };
  }

  // 2. Read first 256KB
  let buffer: ArrayBuffer;
  try {
    buffer = await file.slice(0, 262144).arrayBuffer();
  } catch {
    return {
      file,
      code: 'invalid_format',
      reason: isVideo ? rules.mimeError : IMAGE_RULES.readError,
    };
  }

  // 3. Header check
  if (isVideo) {
    const format = detectVideoFormat(buffer);
    if (!format) {
      return {
        file,
        code: 'invalid_format',
        reason: rules.mimeError,
      };
    }
  } else {
    const res = parseImageHeader(buffer);
    if (!res.ok) {
      return {
        file,
        code: 'invalid_format',
        reason: rules.mimeError,
      };
    }

    const parsed = res.value;
    if (parsed.format === 'heic' || parsed.format === 'avif') {
      return {
        file,
        code: 'heic_not_supported',
        reason: IMAGE_RULES.heicError,
      };
    }

    if (parsed.animated) {
      return {
        file,
        code: 'invalid_format',
        reason: IMAGE_RULES.animatedError,
      };
    }

    // 4. Resolution check
    const { width, height } = parsed;

    if (width < 780 || height < 780) {
      return {
        file,
        code: 'resolution_too_low',
        reason: IMAGE_RULES.resolutionError,
      };
    }
  }

  return null;
}

const validateLimit = pLimit(5);

export async function validateBatch(
  files: File[],
  kind: MediaKind = 'image',
  signal?: AbortSignal,
): Promise<ValidationResult> {
  const valid: File[] = [];
  const rejected: Rejection[] = [];

  const promises = files.map((file) =>
    validateLimit(async () => {
      if (signal?.aborted) return null;
      const rejection = await validateOneAsync(file, kind);
      return { file, rejection };
    })
  );

  const results = await Promise.all(promises);

  if (signal?.aborted) {
    return { valid: [], rejected: [] };
  }

  for (const res of results) {
    if (res) {
      if (res.rejection) {
        rejected.push(res.rejection);
      } else {
        valid.push(res.file);
      }
    }
  }

  return { valid, rejected };
}
