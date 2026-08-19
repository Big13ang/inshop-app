import { Result } from './result';

export type CopyOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export async function copyToClipboard(
  text: string,
  options?: CopyOptions
): Promise<boolean> {
  const result = await Result.try(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard API is not available');
    }
    await navigator.clipboard.writeText(text);
  });

  if (result.ok) {
    options?.onSuccess?.();
    return true;
  } else {
    options?.onError?.(result.error);
    return false;
  }
}