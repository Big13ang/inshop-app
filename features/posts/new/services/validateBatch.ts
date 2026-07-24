import pLimit from 'p-limit';
import { type MediaKind } from '../types';
import { validateOne, type Rejection } from './validateOne';

export type { RejectionCode, Rejection } from './validateOne';

export interface ValidationResult {
  valid: File[];
  rejected: Rejection[];
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
      const rejection = await validateOne(file, kind);
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
