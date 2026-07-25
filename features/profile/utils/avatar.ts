import { Result } from '@/lib/utils';
import { ERROR_MESSAGES } from '@/lib/constants/errors';
import { AVATAR_ACCEPTED_TYPES, PROFILE_LIMITS } from '../constants';

type AcceptedType = (typeof AVATAR_ACCEPTED_TYPES)[number];

function isAcceptedType(type: string): type is AcceptedType {
  return (AVATAR_ACCEPTED_TYPES as readonly string[]).includes(type);
}

export function validateAvatarFile(file: File): Result<File, string> {
  if (!isAcceptedType(file.type)) {
    return Result.err(ERROR_MESSAGES.profile.avatarFormatLimit);
  }
  if (file.size > PROFILE_LIMITS.avatarBytes) {
    return Result.err(ERROR_MESSAGES.profile.avatarSizeLimit);
  }
  return Result.ok(file);
}

export function readFileAsDataUrl(file: File): Promise<Result<string, string>> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const { result } = reader;
      if (typeof result !== 'string') {
        resolve(Result.err(ERROR_MESSAGES.profile.avatarUnreadable));
        return;
      }
      resolve(Result.ok(result));
    };

    reader.onerror = () => {
      resolve(Result.err(ERROR_MESSAGES.profile.avatarUnreadable));
    };

    reader.readAsDataURL(file);
  });
}

/** Validates then reads the picked file into a data URL usable as an <img> src. */
export async function toAvatarPreview(file: File): Promise<Result<string, string>> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) return Result.err(validation.error);

  return readFileAsDataUrl(validation.value);
}
