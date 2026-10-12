import { MessageSquare, Phone, MapPin, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import AppLogo from '@/components/ui/AppLogo';
import { text } from '../constants';

const PRIVACY_INTRO_PARAGRAPHS = [
  'وقتی در اینشاپ حساب میسازید، محصولی منتشر میکنید یا با فروشندهای گفتوگو میکنید، بخشی از اطلاعات خود را در اختیار ما قرار میدهید. این صفحه توضیح میدهد چه اطلاعاتی دریافت میشود، برای چه کاری از آن استفاده میکنیم، چه کسانی ممکن است به آن دسترسی داشته باشند و چگونه میتوانید درخواست خود را درباره اطلاعاتتان مطرح کنید.',
  'این سیاست برای خریداران، فروشندگان و بازدیدکنندگان وبسایت، اپلیکیشن و سایر خدمات رسمی اینشاپ است. مقررات مربوط به قابلیتهای آینده، مانند پرداخت امن یا گفتوگوی هوشمند، پس از فعال شدن آن قابلیت و اطلاعرسانی درباره نحوه پردازش اطلاعات آن اجرا میشود.',
] as const;

interface PrivacySection {
  id: string;
  title: string;
  intro?: string;
  paragraphs?: readonly string[];
  listItems?: readonly {
    label?: string;
    text: string;
  }[];
  outro?: string;
}

const PRIVACY_SECTIONS: readonly PrivacySection[] = [
  {
    id: 'data-collected',
    title: 'چه اطلاعاتی در اینشاپ دریافت میشود؟',
    intro: 'اطلاعات دریافتی به بخشی از اینشاپ که استفاده میکنید بستگی دارد. برای مثال، مشاهده عمومی محصولات با ثبت حساب فروشندگی یا استفاده از خدمات پرداخت، اطلاعات یکسانی نیاز ندارد.',
    listItems: [
      {
        label: 'اطلاعات حساب',
        text: 'شماره تلفن، نام، شناسه کاربری و اطلاعاتی که برای ورود یا تکمیل پروفایل ثبت میکنید.',
      },
      {
        label: 'اطلاعات فروشگاه',
        text: 'نام فروشگاه، توضیحات، تصویر، راههای تماس و سایر مشخصاتی که برای معرفی کسبوکارتان وارد میکنید.',
      },
      {
        label: 'محتوای ثبتشده',
        text: 'تصاویر، توضیحات محصولات، نظرات، گزارش تخلف و فایلهایی که در سامانه بارگذاری میکنید.',
      },
      {
        label: 'گفتوگوها',
        text: 'پیامها، پیوستها و سوابق ارتباط با کاربران، پشتیبانی یا ابزارهای هوشمند، در صورت استفاده از این خدمات.',
      },
      {
        label: 'اطلاعات سفارش و اسناد',
        text: 'مشخصات لازم برای سفارش، تحویل، فاکتور، پیشفاکتور و پیگیری پرداخت، در صورت فعال بودن این قابلیتها.',
      },
      {
        label: 'اطلاعات فنی و استفاده',
        text: 'نشانی IP، نوع مرورگر و دستگاه، زمان مراجعه، صفحات مشاهدهشده، جستوجوها، کلیکها و گزارش خطاهای سامانه.',
      },
    ],
    outro: 'اگر برای خدمتی احراز هویت یا دریافت مدارک لازم باشد، نوع اطلاعات موردنیاز و هدف دریافت آن در همان مرحله اعلام میشود.',
  },
  {
    id: 'data-usage',
    title: 'چرا از اطلاعات کاربران استفاده میکنیم؟',
    intro: 'اطلاعات را در حد لازم برای ارائه و بهبود خدمات اینشاپ پردازش میکنیم. هدفهای اصلی عبارتاند از:',
    listItems: [
      { text: 'ایجاد حساب، ورود و مدیریت دسترسیها؛' },
      { text: 'نمایش فروشگاهها و محصولات و برقراری ارتباط میان کاربران؛' },
      { text: 'ارائه خدمات فعال مانند مدیریت سفارش، فاکتور یا پرداخت؛' },
      { text: 'پاسخگویی به درخواستهای پشتیبانی و بررسی گزارشها؛' },
      { text: 'شناسایی تقلب، دسترسی غیرمجاز و سوءاستفاده از سامانه؛' },
      { text: 'تحلیل عملکرد، رفع خطا و توسعه نرمافزار؛' },
      { text: 'بهبود جستوجو و پیشنهاد محصولات؛' },
      { text: 'اجرای تعهدات قانونی و رسیدگی به درخواست معتبر مراجع صلاحیتدار.' },
    ],
    outro: 'پذیرش این سیاست، مجوز نامحدود برای استفاده از اطلاعات شما در هر موضوعی نیست. اگر پردازش جدیدی خارج از هدفهای اعلامشده نیازمند رضایت باشد، پیش از انجام آن اطلاعرسانی و رضایت لازم دریافت میشود.',
  },
  {
    id: 'public-data',
    title: 'کدام اطلاعات عمومی هستند؟',
    paragraphs: [
      'اطلاعاتی که برای معرفی عمومی فروشگاه یا محصول منتشر میکنید، در محدوده همان بخش برای دیگران قابل مشاهده است. این اطلاعات میتواند شامل نام فروشگاه، تصویر، توضیحات، محصولات و راههای تماسی باشد که برای نمایش عمومی ثبت کردهاید.',
      'صفحات عمومی ممکن است در نتایج موتورهای جستوجو دیده شوند یا از طریق لینک و ابزارهای مجاز نمایش محتوا در سایتهای دیگر نمایش داده شوند. حذف یا ویرایش محتوا در اینشاپ لزوماً به حذف فوری نسخههای ذخیرهشده در موتورهای جستوجو یا محیطهای دیگر منجر نمیشود.',
      'شمارهای که برای ورود ثبت میکنید، صرفاً به دلیل استفاده برای ورود، اطلاعات عمومی محسوب نمیشود. نمایش شماره تماس فروشگاه باید مطابق تنظیمات و اطلاعرسانی همان بخش باشد.',
      'پیش از انتشار، بررسی کنید که محتوای شما شامل اطلاعات شخصی یا محرمانهای نباشد که قصد عمومی کردن آن را ندارید.',
    ],
  },
  {
    id: 'chats-confidentiality',
    title: 'محرمانگی گفتوگوها و پیامهای پشتیبانی',
    paragraphs: [
      'گفتوگوهای خصوصی کاربران، پیامهای پشتیبانی و پیوستهای آنها برای نمایش عمومی منتشر نمیشوند. این اطلاعات برای انتقال پیام، نگهداری سوابق لازم و ارائه خدمات ارتباطی پردازش میشوند.',
      'در صورت گزارش تخلف، احتمال کلاهبرداری، مشکل فنی، اختلاف مرتبط با خدمات یا تکلیف قانونی، افراد مجاز اینشاپ ممکن است در حد ضرورت به سوابق مرتبط دسترسی داشته باشند. دسترسی کارکنان به پیامها باید محدود به وظیفه و موضوع رسیدگی باشد.',
      'عنوان «گفتوگوی مستقیم» یا P2P بهتنهایی به معنی رمزگذاری سرتاسری نیست. ویژگیهای امنیتی هر خدمت، در صورت ارائه، بهصورت مشخص اعلام میشود.',
      'از ارسال رمز عبور، کد ورود، رمز پویا، اطلاعات کامل کارت بانکی و مدارک غیرضروری در گفتوگوها خودداری کنید. اطلاعاتی که برای طرف مقابل ارسال میکنید، در اختیار او نیز قرار میگیرد.',
    ],
  },
  {
    id: 'data-development',
    title: 'استفاده از دادهها در توسعه و برنامهنویسی',
    paragraphs: [
      'اینشاپ میتواند اطلاعات مرتبط را برای شناخت مشکلات، تحلیل رفتار استفاده از سامانه، آزمایش قابلیتها و توسعه نرمافزار پردازش کند. این استفاده باید متناسب با هدف اعلامشده و محدود به اطلاعات ضروری باشد.',
      'برای تحلیل و آزمایش، اولویت با دادههای تجمیعشده، بینام یا نمونههای آزمایشی است. اگر بررسی یک خطا به اطلاعات قابل شناسایی نیاز داشته باشد، دسترسی باید به افراد مجاز و مدت لازم برای رسیدگی محدود شود.',
      'اجازه استفاده فنی از اطلاعات، به معنی انتقال مالکیت محتوای کاربران یا اجازه انتشار اطلاعات محرمانه آنها نیست.',
    ],
  },
  {
    id: 'recommender-ai',
    title: 'سیستم پیشنهاددهنده و خدمات هوش مصنوعی',
    paragraphs: [
      'در صورت فعال بودن سیستم پیشنهاددهنده، اطلاعاتی مانند جستوجوها، محصولات مشاهدهشده و تعامل با محتوا ممکن است برای مرتبسازی و پیشنهاد گزینههای مرتبط استفاده شود.',
      'اگر از گفتوگو یا ابزار هوش مصنوعی استفاده کنید، متن درخواست و اطلاعات ضروری برای پاسخگویی پردازش میشود. پیش از استفاده، باید مشخص باشد که آیا اطلاعات برای پردازش به ارائهدهنده بیرونی ارسال میشود و چه شرایطی بر آن حاکم است.',
      'پردازش یک درخواست برای تولید پاسخ با استفاده از آن برای آموزش مدل تفاوت دارد. استفاده از گفتوگوهای خصوصی یا اطلاعات شخصی برای آموزش مدل، خارج از پردازش ضروری خدمت، باید با توضیح روشن و دریافت رضایت لازم انجام شود.',
      'اطلاعات حساس یا متعلق به دیگران را بدون ضرورت و اجازه در ابزارهای هوشمند وارد نکنید.',
    ],
  },
  {
    id: 'cookies-analytics',
    title: 'کوکیها و ابزارهای تحلیل بازدید',
    paragraphs: [
      'اینشاپ ممکن است از کوکی یا فناوریهای مشابه برای حفظ وضعیت ورود، تنظیمات کاربر، امنیت و سنجش عملکرد استفاده کند. ابزارهای تحلیل بازدید نیز میتوانند اطلاعاتی درباره صفحات مشاهدهشده، جستوجوها و تعامل کاربران ثبت کنند.',
      'اطلاعاتی مانند متن گفتوگوی خصوصی، رمز، شماره تلفن یا جزئیات کامل پرداخت نباید در رویدادهای ابزارهای تحلیل بازدید ارسال شود.',
      'میتوانید کوکیها را از تنظیمات مرورگر مدیریت کنید؛ محدود کردن کوکیهای ضروری ممکن است بر ورود یا عملکرد بعضی بخشها اثر بگذارد. در مواردی که استفاده از ابزارهای غیرضروری نیازمند رضایت باشد، انتخاب مناسب در اختیار کاربر قرار میگیرد.',
    ],
  },
  {
    id: 'invoice-payment',
    title: 'اطلاعات فاکتور، پیشفاکتور و پرداخت',
    paragraphs: [
      'در صورت فعال شدن این خدمات، اطلاعات لازم برای ثبت سند، پیگیری تراکنش، تسویه یا استرداد وجه پردازش خواهد شد. این اطلاعات ممکن است شامل مبلغ، شناسه پرداخت، وضعیت تراکنش و مشخصات ضروری طرفین باشد.',
      'اطلاعات محرمانه کارت باید در مسیر رسمی ارائهدهنده پرداخت وارد شود و نباید از طریق چت یا فرم عمومی برای اینشاپ یا فروشنده ارسال شود.',
      'دسترسی به فاکتور و پیشفاکتور باید به اشخاص مرتبط و افراد مجاز برای پشتیبانی یا تکالیف قانونی محدود باشد. شرایط دقیق دریافت، نگهداری و انتقال اطلاعات پرداخت پیش از راهاندازی خدمت مربوط اعلام میشود.',
    ],
  },
  {
    id: 'data-access-parties',
    title: 'چه کسانی ممکن است به اطلاعات دسترسی داشته باشند؟',
    intro: 'دسترسی به اطلاعات خصوصی باید بر اساس نیاز به انجام خدمت محدود شود. حسب مورد، اطلاعات ضروری میتواند در اختیار این گروهها قرار گیرد:',
    listItems: [
      { text: 'کارکنان مجاز برای پشتیبانی، امنیت و رسیدگی فنی؛' },
      { text: 'ارائهدهندگان زیرساخت، پیامک، پرداخت و سایر خدمات موردنیاز؛' },
      { text: 'طرف مقابل معامله، در حد اطلاعات لازم برای ارتباط، سفارش یا تحویل؛' },
      { text: 'مراجع صلاحیتدار، در حدود درخواست قانونی و معتبر.' },
    ],
    paragraphs: [
      'اشتراکگذاری با ارائهدهندگان خدمات باید همراه با الزامات مناسب محرمانگی و امنیت باشد. اگر پردازش یک خدمت به انتقال اطلاعات به ارائهدهنده خارجی نیاز داشته باشد، این موضوع باید پیش از استفاده از آن خدمت توضیح داده شود.',
      'اطلاعات شخصی کاربران برای فروش به اشخاص ثالث جمعآوری نمیشود.',
    ],
  },
  {
    id: 'legal-authorities',
    title: 'ارائه اطلاعات به مراجع قانونی',
    paragraphs: [
      'در صورت دریافت دستور یا درخواست معتبر از مرجع دارای صلاحیت قانونی، اینشاپ میتواند اطلاعات مرتبط را در حدود قانون و موضوع درخواست ارائه کند.',
      'همچنین ممکن است حفظ بعضی سوابق برای رسیدگی به شکایت، بررسی تقلب یا اجرای تکلیف قانونی ضروری باشد. ارائه اطلاعات به اشخاص عادی صرفاً به دلیل طرح ادعا یا درخواست، جایگزین این فرایند قانونی نیست.',
    ],
  },
  {
    id: 'seller-responsibilities',
    title: 'مسئولیت فروشندگان در حفظ اطلاعات خریداران',
    paragraphs: [
      'فروشنده ممکن است برای پاسخگویی، ارسال کالا یا انجام خدمت به اطلاعاتی از خریدار دسترسی پیدا کند. این اطلاعات باید فقط برای همان هدف و تکالیف قانونی مرتبط استفاده شود.',
      'استفاده از اطلاعات خریدار برای تبلیغات ناخواسته، انتشار عمومی، فروش به دیگران یا موضوعی خارج از توافق و مجوز قانونی مجاز نیست. فروشنده باید از اطلاعات دریافتی محافظت کند و آنها را بیش از ضرورت نگهداری نکند.',
      'نقش اینشاپ بهعنوان واسطه معرفی، تعهدات خود اینشاپ درباره حفاظت از دادههای موجود در سامانه را از بین نمیبرد.',
    ],
  },
  {
    id: 'security-retention',
    title: 'امنیت و نگهداری اطلاعات',
    paragraphs: [
      'اینشاپ باید اقدامات فنی و سازمانی متناسبی برای حفاظت از اطلاعات، محدود کردن دسترسی و پیشگیری از سوءاستفاده به کار بگیرد. هیچ سامانهای امنیت مطلق ندارد؛ با این حال، این موضوع مسئولیت رسیدگی به رخدادهای امنیتی و اجرای تعهدات قانونی را حذف نمیکند.',
      'اطلاعات باید فقط برای مدتی نگهداری شود که برای ارائه خدمت، هدف اعلامشده یا الزام قانونی لازم است. مدت نگهداری همه دادهها یکسان نیست؛ سوابق مالی، گزارشهای امنیتی و اطلاعات حساب ممکن است شرایط متفاوتی داشته باشند.',
      'پس از پایان ضرورت نگهداری، اطلاعات باید مطابق رویه مشخص حذف یا بهگونهای بینام شود که شناسایی کاربر ممکن نباشد. نسخههای پشتیبان نیز باید چرخه نگهداری و حذف مشخص داشته باشند.',
    ],
  },
  {
    id: 'data-access-deletion',
    title: 'دسترسی، اصلاح و درخواست حذف اطلاعات',
    paragraphs: [
      'برای دسترسی به اطلاعات شخصی، اصلاح اطلاعات نادرست یا درخواست حذف آنها میتوانید با پشتیبانی اینشاپ ارتباط بگیرید. برای جلوگیری از دسترسی افراد دیگر، ممکن است تأیید هویت درخواستکننده لازم باشد.',
      'حذف حساب با حذف فوری همه سوابق یکسان نیست. اگر نگهداری بخشی از اطلاعات به دلیل الزام قانونی یا رسیدگی به اختلاف ضروری باشد، آن بخش در حد ضرورت حفظ میشود و محدودیت مربوط، تا جایی که قانون اجازه دهد، به شما توضیح داده خواهد شد.',
      'درخواست حذف پیام نیز لزوماً به حذف نسخهای که مخاطب قبلاً دریافت یا خارج از اینشاپ ذخیره کرده است منجر نمیشود.',
      'اگر پردازشی بر رضایت قابل پسگرفتن شما متکی باشد، میتوانید درخواست توقف آن را مطرح کنید. توقف اطلاعات ضروری برای یک خدمت ممکن است استفاده از همان خدمت را محدود کند.',
    ],
  },
  {
    id: 'notifications-marketing',
    title: 'پیامهای اطلاعرسانی و تبلیغاتی',
    paragraphs: [
      'پیامهای مربوط به ورود، امنیت حساب، وضعیت خدمت یا پاسخ پشتیبانی با پیامهای تبلیغاتی تفاوت دارند.',
      'برای پیامهای تبلیغاتی، انتخاب کاربر و امکان انصراف باید رعایت شود. انصراف از تبلیغات لزوماً مانع دریافت پیامهای ضروری مربوط به حساب یا خدمات در حال استفاده نمیشود.',
    ],
  },
  {
    id: 'external-links-services',
    title: 'لینکها و خدمات خارج از اینشاپ',
    paragraphs: [
      'اگر از طریق اینشاپ وارد سایت فروشنده، پیامرسان، درگاه پرداخت یا خدمت دیگری شوید، پردازش اطلاعات در آن محیط تابع سیاست حریم خصوصی همان ارائهدهنده است.',
      'هنگام نمایش محتوای اینشاپ در یک سایت دیگر نیز ممکن است آن سایت اطلاعاتی مانند بازدید یا مشخصات فنی دستگاه را مستقل دریافت کند. سیاست حاضر، پردازش اطلاعات توسط خود اینشاپ را پوشش میدهد.',
    ],
  },
  {
    id: 'policy-changes',
    title: 'تغییرات سیاست حریم خصوصی',
    paragraphs: [
      'نسخه جاری این سیاست همراه با تاریخ بهروزرسانی در این صفحه منتشر میشود. تغییرات مهم درباره هدف استفاده، اشتراکگذاری یا حقوق کاربران باید از مسیر مناسب اطلاعرسانی شود.',
      'اگر تغییر جدید به رضایت نیاز داشته باشد، صرف انتشار متن تازه جایگزین دریافت آن رضایت نخواهد بود.',
    ],
  },
] as const;

const PRIVACY_CONTACT = {
  intro: 'برای پرسش یا درخواست درباره اطلاعات شخصی خود، از راههای زیر با ما ارتباط بگیرید و موضوع پیام را «حریم خصوصی» بنویسید:',
  bale: {
    label: 'پیام‌رسان بله',
    handle: '@inShop_support',
    url: 'https://ble.ir/inShop_support',
  },
  phone: {
    label: 'تلفن',
    raw: '02191099960',
  },
  address: {
    label: 'نشانی',
    value: 'شیراز، معالیآباد، مجتمع تجاری فرهنگی الف، طبقه ششم، واحد ۶۰۴',
  },
  outro: 'برای بررسی درخواست، تنها اطلاعات ضروری را ارسال کنید. رمز عبور، کد ورود و اطلاعات محرمانه کارت بانکی را در پیام ننویسید.',
} as const;

export function PrivacyView() {
  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="privacy-back-btn" />
        <Header.Title>{text.menu.items.privacy.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <AppLogo />
            <p className="text-xs text-secondary leading-relaxed px-2">
              {text.menu.items.privacy.description}
            </p>
          </div>

          {/* سیاست حفظ حریم خصوصی اینشاپ */}
          <div className="rounded-2xl border border-primary/5 bg-surface p-4 text-right space-y-3 shadow-sm">
            <h1 className="text-xs font-bold text-secondary">سیاست حفظ حریم خصوصی اینشاپ</h1>
            <div className="space-y-2.5 text-xs text-secondary leading-6 font-normal">
              {PRIVACY_INTRO_PARAGRAPHS.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* بخش‌های تفصیلی سیاست حریم خصوصی */}
          <div className="space-y-4">
            {PRIVACY_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="rounded-2xl border border-primary/5 bg-surface p-4 text-right space-y-3 shadow-sm"
              >
                <h2 className="text-xs font-bold text-secondary">{section.title}</h2>

                {section.intro && (
                  <p className="text-xs text-secondary leading-6 font-normal">
                    {section.intro}
                  </p>
                )}

                {section.listItems && (
                  <ul className="space-y-2.5 text-xs text-secondary leading-6 font-normal list-none p-0 m-0">
                    {section.listItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-primary/60 shrink-0 mt-2" aria-hidden="true" />
                        <span>
                          {item.label && (
                            <strong className="font-bold text-foreground">{item.label}: </strong>
                          )}
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.paragraphs && (
                  <div className="space-y-2.5 text-xs text-secondary leading-6 font-normal">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {section.outro && (
                  <p className="text-xs text-secondary leading-6 font-normal">
                    {section.outro}
                  </p>
                )}
              </div>
            ))}

            {/* بخش ارتباط درباره حریم خصوصی */}
            <div className="rounded-2xl border border-primary/5 bg-surface p-4 text-right space-y-3 shadow-sm">
              <h2 className="text-xs font-bold text-secondary">ارتباط درباره حریم خصوصی</h2>
              <p className="text-xs text-secondary leading-6 font-normal">
                {PRIVACY_CONTACT.intro}
              </p>

              <div className="space-y-3 pt-1">
                {/* پیام‌رسان بله */}
                <a
                  id="privacy-bale-link"
                  href={PRIVACY_CONTACT.bale.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface-l1 shadow-sm text-right transition-colors hover:bg-container-base active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-xl bg-surface flex items-center justify-center shrink-0 border border-primary/5 text-secondary group-hover:text-primary transition-colors">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground">پیام‌رسان بله</span>
                      <span className="text-xs text-primary font-medium mt-0.5" dir="ltr">
                        {PRIVACY_CONTACT.bale.handle}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="size-4 shrink-0 text-secondary/60 group-hover:text-primary transition-colors" aria-hidden="true" />
                </a>

                {/* تلفن */}
                <a
                  id="privacy-phone-link"
                  href={`tel:${PRIVACY_CONTACT.phone.raw}`}
                  className="flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface-l1 shadow-sm text-right transition-colors hover:bg-container-base active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-xl bg-surface flex items-center justify-center shrink-0 border border-primary/5 text-secondary group-hover:text-primary transition-colors">
                      <Phone className="size-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground">تلفن</span>
                      <span className="text-xs font-semibold text-foreground mt-0.5" dir="ltr">
                        {PRIVACY_CONTACT.phone.raw}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shrink-0 shadow-xs transition-transform group-hover:opacity-95 active:scale-95">
                    تماس
                  </span>
                </a>

                {/* نشانی */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-primary/5 bg-surface-l1 shadow-sm text-right">
                  <div className="size-10 rounded-xl bg-surface flex items-center justify-center shrink-0 border border-primary/5 text-secondary">
                    <MapPin className="size-5" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground">نشانی</span>
                    <span className="text-[11px] text-secondary leading-5 mt-1">
                      {PRIVACY_CONTACT.address.value}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-secondary/80 leading-5 pt-1">
                {PRIVACY_CONTACT.outro}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
