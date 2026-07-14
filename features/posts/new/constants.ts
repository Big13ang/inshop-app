import { ERROR_MESSAGES } from '@/lib/constants/errors';

export const MAX_IMAGES = 10;

export const text = {
  // Header
  headerTitle: 'پست جدید',

  // Footer actions
  nextButton: 'بعدی',
  addButton: 'اضافه کردن',
  shareButton: 'اشتراک‌گذاری',

  // Validation alerts
  alertNoImages: ERROR_MESSAGES.validation.noImages,
  alertNoCaption: ERROR_MESSAGES.validation.noCaption,
  alertUploadsInProgress: ERROR_MESSAGES.validation.uploadsInProgress,
  alertInvalidImageFormat: ERROR_MESSAGES.upload.imageFormatLimit,
  alertImageTooLarge: ERROR_MESSAGES.upload.imageSizeLimit,
  loadingSession: 'در حال آماده‌سازی برای بارگذاری...',

  // Caption form
  captionLabel: 'توضیحات محصول',
  captionPlaceholder: 'توضیحات محصول را در این قسمت بنویسید',
  captionError: ERROR_MESSAGES.validation.captionRequired,


  // Upload overlay
  uploadingTitle: 'در حال بارگذاری پست...',
  uploadingDesc: 'لطفاً صفحه را نبندید',
  uploadSuccessTitle: 'ارسال شد برای بررسی',
  uploadSuccessDesc: 'پست با موفقیت ثبت شد و پس از بررسی و تایید نهایی توسط ناظر در ویترین فروشگاه شما منتشر خواهد شد',
  statusQueued: 'در صف',
  statusUploading: 'در حال ارسال',
  statusCompleted: 'آپلود شد',
  statusCancelled: 'لغو شد',
  statusFailed: 'خطا',
} as const;
