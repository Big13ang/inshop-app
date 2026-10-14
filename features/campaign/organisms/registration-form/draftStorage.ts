import { Result, storage } from '@/lib/utils';
import { defaultRegistrationValues, RegistrationData, registrationSchema } from './schema';

const STORAGE_KEY = 'REGISTRATION_DRAFT';
const SUCCESS_KEY = 'PRE_REGISTRATION_SUCCESS';
const UTM_SOURCE_KEY = 'REGISTRATION_UTM_SOURCE';

export interface InitialRegistrationState {
  isRegistered: boolean;
  values: RegistrationData;
}

const getValidatedDraftValues = (rawDraft: unknown): Partial<RegistrationData> => {
  if (!rawDraft || typeof rawDraft !== 'object') return {};

  const draft = rawDraft as Record<string, unknown>;
  const validatedDraft: Partial<RegistrationData> = {};

  (Object.keys(defaultRegistrationValues) as Array<keyof RegistrationData>).forEach((key) => {
    const parsedField = registrationSchema.shape[key].safeParse(draft[key]);
    if (parsedField.success) {
      validatedDraft[key] = parsedField.data;
    }
  });

  return validatedDraft;
};

const captureUtmSource = () => {
  const utmSourceFromUrl = new URLSearchParams(window.location.search).get('utm_source');

  if (utmSourceFromUrl) {
    storage.set(UTM_SOURCE_KEY, utmSourceFromUrl);
    return;
  }

  const savedUtmSource = storage.get(UTM_SOURCE_KEY);
  if (!(savedUtmSource.ok && savedUtmSource.value)) {
    storage.set(UTM_SOURCE_KEY, 'direct');
  }
};

const readDraftValues = (): Partial<RegistrationData> => {
  const savedDraft = storage.get(STORAGE_KEY);
  if (!savedDraft.ok || !savedDraft.value) return {};

  const draftJson = savedDraft.value;
  const parsedDraft = Result.trySync<unknown>(() => JSON.parse(draftJson));
  if (!parsedDraft.ok) {
    console.error('Error parsing draft:', parsedDraft.error);
    return {};
  }

  return getValidatedDraftValues(parsedDraft.value);
};

/** Browser-only: records the UTM source, then restores the success flag or the saved draft. */
export const readInitialRegistrationState = (): InitialRegistrationState => {
  captureUtmSource();

  const successStatus = storage.get(SUCCESS_KEY);
  if (successStatus.ok && successStatus.value === 'true') {
    return { isRegistered: true, values: defaultRegistrationValues };
  }

  return {
    isRegistered: false,
    values: { ...defaultRegistrationValues, ...readDraftValues() },
  };
};

export const saveRegistrationDraft = (values: Partial<RegistrationData>) => {
  storage.set(
    STORAGE_KEY,
    JSON.stringify({
      ...defaultRegistrationValues,
      ...values,
    })
  );
};

export const markRegistrationSubmitted = () => {
  storage.remove(STORAGE_KEY);
  storage.set(SUCCESS_KEY, 'true');
};

export const clearRegistrationSubmitted = () => {
  storage.remove(SUCCESS_KEY);
};
