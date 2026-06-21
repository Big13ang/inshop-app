export const text = {
  // Header
  headerTitle: 'پست‌های در انتظار بررسی',

  // Notice banner
  noticeText:
    'پست شما پس از بررسی و تأیید ناظر، به صورت عمومی منتشر خواهد شد. در صورت بروز هرگونه مشکل تاییدیه با علت مربوطه نمایش داده می‌شود.',

  // Empty state
  emptyTitle: 'صف بررسی خالی است',
  emptyDescription: 'در حال حاضر هیچ عکسی در صف بررسی ناظر ندارید.',
  emptyActionLabel: 'ثبت و ارسال پست جدید',

  // Status badges
  statusPending: 'در انتظار بررسی',
  statusRejected: 'رد شده (مشاهده علت)',
  statusRejectedShort: 'رد شده',

  // Delete menu
  menuTitle: 'تنظیمات پیش‌نویس',
  deleteLabel: 'حذف پیش‌نویس',
  deleteHint: 'لغو انتشار و حذف',
  deleteSuccess: 'درخواست انتشار با موفقیت لغو و پیش نویس حذف شد.',
  deleteError: 'حذف پیش‌نویس با خطا مواجه شد، دوباره تلاش کنید.',

  // Rejection overlay
  rejectionTitle: 'عدم تأیید انتشار پست',
  rejectionActionText: 'مشاهده تصویر پست',
  rejectionDefaultReason: 'تصویر انتخاب شده مناسب نبوده یا با قوانین انضباطی پلتفرم مغایرت دارد.',
  rejectionDismissedToast: 'علت رد درخواست پنهان شد. برای مشاهده مجدد دکمه بالا را لمس کنید.',
  rejectionShowDetails: 'مشاهده جزئیات خط‌مشی پلتفرم',
  rejectionHideDetails: 'پنهان کردن جزئیات خط‌مشی',
  rejectionTips: [
    'عدم همخوانی متن کپشن با محتوا',
    'کیفیت پایین یا تاری بیش از حد تصویر',
    'وجود لوگو یا دامنه سایت‌های دیگر',
    'نقض قوانین کپی‌رایت یا کپی از کاربران دیگر',
  ],
} as const;
