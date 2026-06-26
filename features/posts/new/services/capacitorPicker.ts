import { Result } from '@/lib/utils/result';
import type { MediaResult } from '@capacitor/camera';

const toError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

/**
 * Checks if the application is running inside a Capacitor native container.
 */
export async function isCapacitorNative(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch (error) {
    console.warn('Capacitor check failed', error);
    return false;
  }
}

/**
 * Converts a selected native media item into a standard JS File object.
 */
async function convertMediaToFile(photo: MediaResult, index: number): Promise<File | null> {
  if (!photo.webPath) return null;

  const format = photo.metadata?.format || 'jpeg';
  const filename = `photo-${Date.now()}-${index}.${format}`;

  const response = await fetch(photo.webPath);
  const blob = await response.blob();

  return new File([blob], filename, {
    type: blob.type || `image/${format}`,
  });
}

/**
 * Opens the native gallery picker and returns selected images as standard File objects.
 * Uses the Result pattern for robust error handling.
 */
export async function pickNativeImages(limit: number): Promise<Result<File[], Error>> {
  try {
    const { Camera } = await import('@capacitor/camera');
    const result = await Camera.chooseFromGallery({
      quality: 90,
      limit,
      allowMultipleSelection: true,
      includeMetadata: true,
    });

    const filePromises = result.results.map(
      (photo, index) => convertMediaToFile(photo, index)
    );

    const resolvedFiles = await Promise.all(filePromises);

    const validFiles = resolvedFiles.filter(Boolean) as File[];

    return Result.ok(validFiles);
  } catch (error) {
    return Result.err(toError(error));
  }
}
