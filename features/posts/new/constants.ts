export const alertBannerAnimation = {
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    duration: 0.25,
    ease: 'power2.in',
  },
  entranceFrom: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  entranceTo: {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.35,
    ease: 'back.out(1.5)',
  },
} as const;

export const text = {
  // Header
  headerTitle: 'پست جدید',

  // Post type dialog
  dialogTitle: 'نوع پست را انتخاب کنید',
  choiceReels: 'ریلز با کاور',
  choiceImages: 'آلبوم تصاویر',

  // Footer actions
  nextButton: 'بعدی',
  addButton: 'اضافه کردن',
  shareButton: 'اشتراک‌گذاری',

  // Validation alerts
  alertNoVideo: 'لطفاً یک ویدیو برای ریلز انتخاب کنید',
  alertNoCover: 'لطفاً یک تصویر کاور برای ریلز انتخاب کنید',
  alertNoImages: 'لطفاً حداقل ۱ تصویر برای آلبوم انتخاب فرمایید',
  alertNoCaption: 'متن کپشن نمی‌تواند خالی باشد',
  alertInvalidImageFormat: 'فرمت فایل نامعتبر است (فقط JPG، PNG، WEBP مجاز است)',
  alertImageTooLarge: 'حجم عکس نباید بیشتر از ۱۰ مگابایت باشد',
  alertInvalidVideoFormat: 'فرمت ویدیو نامعتبر است (فقط MP4 و MOV مجاز است)',
  alertVideoTooLarge: 'حجم ویدیو نباید بیشتر از ۱۰۰ مگابایت باشد',

  // Caption form
  captionLabel: 'توضیحات محصول',
  captionPlaceholder: 'توضیحات محصول را در این قسمت بنویسید',
  captionError: 'توضیحات محصول اجباری است',

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
