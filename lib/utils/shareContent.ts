import { Result } from './result';

export type ShareData = {
  title?: string;
  text?: string;
  url?: string;
};

export type ShareOptions = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareContent(
  data: ShareData,
  options?: ShareOptions
): Promise<boolean> {
  const result = await Result.try(async () => {
    if (!canShare()) {
      throw new Error('Web Share API is not supported');
    }
    await navigator.share(data);
  });

  if (result.ok) {
    options?.onSuccess?.();
    return true;
  } else {
    options?.onError?.(result.error);
    return false;
  }
}
