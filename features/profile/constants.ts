export const PROFILE_LIMITS = {
  shopName: { min: 3, max: 60 },
  handle: { min: 3, max: 30 },
  bio: { max: 150 },
  address: { max: 80 },
  avatarBytes: 5 * 1024 * 1024,
} as const;

export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const PROFILE_ROUTES = {
  overview: '/app/profile',
  edit: '/app/profile/edit',
  pendingPosts: '/app/posts/pending',
  newPost: '/app/posts/new',
} as const;

export const text = {
  overview: {
    fallbackShopName: 'فروشگاه بدون نام',
    fallbackHandle: 'inshop_seller',
    bioEmpty: 'هنوز معرفی‌ای برای فروشگاه خود ننوشته‌اید. با لمس دکمه ویرایش، فروشگاهتان را معرفی کنید.',

    // The backend exposes no follower/following data, so the stat row reports
    // post counts the seller can actually act on instead of inventing numbers.
    statPublished: 'منتشر شده',
    statPending: 'در انتظار',
    statRejected: 'رد شده',

    pendingBannerTitle: 'پست‌های در انتظار بررسی',
    pendingBannerSubtitle: (count: number) => `${count} پست در انتظار بررسی ناظر`,
    pendingBannerAction: 'مشاهده صف',

    callAction: 'تماس با فروشگاه',
    editAction: 'ویرایش',
    editActionTitle: 'ویرایش پروفایل فروشگاه',
    shareAction: 'اشتراک‌گذاری',
    shareActionTitle: 'اشتراک‌گذاری فروشگاه',

    shareCopied: 'لینک فروشگاه کپی شد.',
    shareFailed: 'کپی کردن لینک انجام نشد. لطفا دوباره تلاش کنید.',
    callUnavailable: 'شماره تماسی برای این فروشگاه ثبت نشده است.',

    gridEmptyTitle: 'هنوز پستی منتشر نشده',
    gridEmptyDescription: 'پس از تأیید ناظر، پست‌های شما در این بخش نمایش داده می‌شوند.',
    gridEmptyAction: 'ثبت پست جدید',
    gridItemLabel: (caption: string) => `مشاهده پست ${caption}`,
    gridMultiMediaLabel: 'این پست چند رسانه دارد',
  },

  edit: {
    headerTitle: 'ویرایش پروفایل',

    avatarSectionTitle: 'تصویر پروفایل',
    avatarUploadAction: 'انتخاب تصویر جدید از گالری',
    avatarAlt: 'تصویر پروفایل فروشگاه',
    avatarSelected: 'تصویر جدید انتخاب شد. برای ثبت، تغییرات را ذخیره کنید.',

    shopSectionTitle: 'اطلاعات فروشگاه',
    shopNameLabel: 'نام فروشگاه',
    shopNamePlaceholder: 'مثال: گالری طلای مدرن',
    handleLabel: 'آیدی اختصاصی',
    handlePlaceholder: 'modern_gold',
    handleHelper: 'آیدی شما در نشانی فروشگاه استفاده می‌شود.',

    bioSectionTitle: 'معرفی فروشگاه',
    bioLabel: 'متن معرفی',
    bioPlaceholder: 'درباره خدمات، محصولات و زمینه کاری فروشگاه بنویسید...',
    bioCounter: (current: number, max: number) => `${current} از ${max} کاراکتر`,

    addressSectionTitle: 'آدرس',
    addressLabel: 'نشانی دقیق',
    addressPlaceholder: 'مثال: تهران، خیابان پاسداران، پلاک ۱۲',
    showAddressLabel: 'نمایش آدرس در صفحه پروفایل',

    contactSectionTitle: 'اطلاعات تماس',
    phoneLabel: 'شماره تماس فروشگاه',
    phonePlaceholder: '09171234567',
    phoneHelper: 'این شماره برای تماس مشتریان با شما نمایش داده می‌شود.',

    requiredMark: 'الزامی',
    saveAction: 'ذخیره تغییرات',
    savingAction: 'در حال ذخیره...',
    cancelAction: 'انصراف',
    saveSuccess: 'تغییرات پروفایل با موفقیت ذخیره شد.',
    noChanges: 'تغییری برای ذخیره وجود ندارد.',
  },
} as const;
