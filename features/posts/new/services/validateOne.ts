import { type MediaKind } from '../types';
import { parseImageHeader, type ParsedHeader } from './headerParser';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { Result } from '@/lib/utils/result';

export const REJECTION_CODES = {
  INVALID_FORMAT: 'invalid_format',
  FILE_TOO_LARGE: 'file_too_large',
  RESOLUTION_TOO_LOW: 'resolution_too_low',
  HEIC_NOT_SUPPORTED: 'heic_not_supported',
} as const;

export type RejectionCode = (typeof REJECTION_CODES)[keyof typeof REJECTION_CODES];

export type FileValidationRejection = {
  file: File;
  code: RejectionCode;
  reason: string;
};

export type Rejection = FileValidationRejection;


export type ValidatorFn = (file: File) => Promise<FileValidationRejection | null>;

const IMAGE_RULES = {
  maxBytes: 10 * 1024 * 1024,
  minDimension: 1080,
  mimeError: ERROR_MESSAGES.upload.imageFormatLimit,
  sizeError: ERROR_MESSAGES.upload.imageSizeLimit,
  resolutionError: ERROR_MESSAGES.upload.resolutionTooSmall,
  heicError: ERROR_MESSAGES.upload.heicNotSupported,
  animatedError: ERROR_MESSAGES.upload.animatedWebpNotAllowed,
  readError: ERROR_MESSAGES.upload.fileUnreadable,
};

function isDimensionValid(width: number, height: number): boolean {
  return width >= IMAGE_RULES.minDimension && height >= IMAGE_RULES.minDimension;
}

function isUnsupportedFormat(format: string): boolean {
  return format === 'heic' || format === 'avif';
}

async function readHeaderBuffer(file: File, bytes: number = 262144): Promise<Result<ArrayBuffer>> {
  return Result.try(file.slice(0, bytes).arrayBuffer());
}

function validateHeaderRules(parsed: ParsedHeader): Omit<FileValidationRejection, 'file'> | null {
  if (isUnsupportedFormat(parsed.format)) {
    return { code: REJECTION_CODES.HEIC_NOT_SUPPORTED, reason: IMAGE_RULES.heicError };
  }

  if (parsed.animated) {
    return { code: REJECTION_CODES.INVALID_FORMAT, reason: IMAGE_RULES.animatedError };
  }

  if (!isDimensionValid(parsed.width, parsed.height)) {
    return { code: REJECTION_CODES.RESOLUTION_TOO_LOW, reason: IMAGE_RULES.resolutionError };
  }

  return null;
}

export async function validateImage(file: File): Promise<FileValidationRejection | null> {
  if (file.size > IMAGE_RULES.maxBytes) {
    return { file, code: REJECTION_CODES.FILE_TOO_LARGE, reason: IMAGE_RULES.sizeError };
  }

  const bufferResult = await readHeaderBuffer(file);
  if (!bufferResult.ok) {
    return { file, code: REJECTION_CODES.INVALID_FORMAT, reason: IMAGE_RULES.readError };
  }

  const parseResult = parseImageHeader(bufferResult.value);
  if (!parseResult.ok) {
    return { file, code: REJECTION_CODES.INVALID_FORMAT, reason: IMAGE_RULES.mimeError };
  }

  const headerRejection = validateHeaderRules(parseResult.value);
  if (headerRejection) {
    return { ...headerRejection, file };
  }

  return null;
}

const VALIDATORS: Record<string, ValidatorFn> = {
  image: validateImage,
};

export function registerValidator(kind: string, validator: ValidatorFn): void {
  VALIDATORS[kind] = validator;
}

export async function validateOne(file: File, kind: MediaKind = 'image'): Promise<FileValidationRejection | null> {
  const validator = VALIDATORS[kind];
  if (!validator) {
    return null;
  }
  return validator(file);
}
