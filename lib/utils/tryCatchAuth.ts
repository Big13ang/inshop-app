import { toast } from 'sonner';

type AuthError = { message?: string } | Error;

type Success<T> = {
  data: T;
  error: null;
};

type Failure = {
  data: null;
  error: AuthError;
};

type Result<T> = Success<T> | Failure;

/**
 * Wraps better-auth API calls, handles API response errors and network errors in one unified layer.
 * Displays error toasts automatically using the provided fallback message.
 */
export async function tryCatchAuth<T extends { error: { message?: string } | null }>(
  promise: Promise<T>,
  fallbackMessage: string
): Promise<Result<T>> {
  try {
    const data = await promise;

    if (data.error) {
      toast.error(data.error.message || fallbackMessage);
      return { data: null, error: data.error };
    }

    return { data, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    toast.error(err.message || fallbackMessage);

    return { data: null, error: err };
  }
}
