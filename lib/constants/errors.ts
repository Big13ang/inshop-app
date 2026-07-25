/**
 * ERROR MESSAGE GUIDELINES & STYLE GUIDE:
 * 
 * 1. Tone & Voice: Friendly, kind, direct, and conversational (NOT overly formal or robotic).
 * 2. Terminology:
 *    - Use "پست" (Post) instead of "آلبوم" (Album).
 *    - Use "وارد کردن" instead of "درج".
 *    - Avoid "مواجه گردید" or "مواجه شد" — use "با خطا روبرو شد" or "انجام نشد".
 *    - Avoid formal phrasing like "فراتر از حد مجاز" — use clear statements like "حجم عکس باید کمتر از ۱۰ مگابایت باشد".
 * 3. Actionability & Problem Solving:
 *    - State clearly WHY the action/file was rejected.
 *    - Provide actionable advice on what the user should do next (e.g., "لطفا دوباره تلاش کنید", "صفحه را رفرش کنید", "فرمت عکس را تغییر دهید").
 */

export const ERROR_MESSAGES = {
  auth: {
    sendOtpFailed: 'ارسال کد تایید با خطا روبرو شد. لطفا دوباره تلاش کنید.',
    verifyOtpFailed: 'تایید کد وارد شده با خطا روبرو شد. لطفا دوباره تلاش کنید.',
    signOutFailed: 'خروج از حساب کاربری انجام نشد. لطفا دوباره تلاش کنید.',
    invalidPhone: 'شماره تلفن همراه وارد شده صحیح نیست. نمونه صحیح: 09171234567',
    requiredPhone: 'وارد کردن شماره تلفن همراه الزامی است.',
  },
  upload: {
    sessionInvalid: 'شناسه بارگذاری پست نامعتبر است. برای تلاش مجدد صفحه را رفرش کنید.',
    failed: 'بارگذاری فایل با خطا روبرو شد. لطفا دوباره تلاش کنید.',
    resolutionTooSmall: 'کیفیت عکس شما پایین است. حداقل کیفیت عکس باید ۱۰۸۰x۱۰۸۰ پیکسل باشد.',
    imageSizeLimit: 'حجم عکس باید کمتر از ۱۰ مگابایت باشد.',
    imageFormatLimit: 'فرمت تصویر نامعتبر است. فقط عکس‌های JPG، PNG و WEBP مجاز هستند.',
    heicNotSupported: 'عکس‌های HEIC پشتیبانی نمی‌شوند. لطفا فرمت عکس را به JPG یا PNG تغییر دهید.',
    animatedWebpNotAllowed: 'فایل‌های GIF و عکس‌های متحرک مجاز نیستند. لطفا عکس معمولی ارسال کنید.',
    fileUnreadable: 'فایل شما قابل خواندن نیست. لطفا فایل دیگری انتخاب کنید.',
    imageUnacceptable: (filename: string) => `عکس "${filename}" قابل پذیرش نیست`,
    failedToUpload: (filename: string) => `بارگذاری فایل "${filename}" با خطا روبرو شد. لطفا دوباره تلاش کنید.`,
    videoSizeLimit: 'حجم ویدیو باید کمتر از ۵۰۰ مگابایت باشد.',
    videoFormatLimit: 'فرمت ویدیو نامعتبر است. فقط ویدیوهای MP4، WebM و MOV مجاز هستند.',
    maxImagesLimit: (max: number) => `حداکثر ${max} تصویر می‌توانید انتخاب کنید`,
    maxImagesReached: (available: number) => `فقط ${available} تصویر دیگر می‌توانید اضافه کنید`,
    preparingUpload: 'در حال آماده‌سازی برای بارگذاری پست...',
  },
  validation: {
    noImages: 'انتخاب حداقل ۱ تصویر برای پست الزامی است.',
    noCaption: 'وارد کردن توضیحات (کپشن) الزامی است.',
    uploadsInProgress: 'لطفاً تا اتمام بارگذاری عکس‌ها منتظر بمانید.',
    captionRequired: 'وارد کردن توضیحات محصول الزامی است.',
    minCaptionLength: (min: number) => `توضیحات محصول باید حداقل ${min} کاراکتر باشد`,
  },
  posts: {
    submitFailed: 'ثبت پست با خطا روبرو شد. لطفا دوباره تلاش کنید.',
    deleteFailed: 'حذف پست انجام نشد. لطفا دوباره تلاش کنید.',
    deleteDraftFailed: 'حذف پیش‌نویس انجام نشد. لطفا دوباره تلاش کنید.',
    imageDeleteSuccess: 'تصویر با موفقیت حذف شد',
  },
} as const;

