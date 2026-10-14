import { Globe } from 'lucide-react';
import { InShopLogo } from '../atoms/InShopLogo';
import { BALE_SUPPORT_ACCOUNT_URL } from '@/features/campaign/constants/links';

export const Footer = () => {
  return (
    <footer id="contact" className="bg-stone-50 pt-20 pb-10 border-t border-stone-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <InShopLogo />
            <p className="text-stone-500 max-w-sm leading-relaxed mb-6 text-right">
              پلتفرم رسمی فروشگاهی "inShop" حامی کسب‌وکارهای کوچک در فضای آنلاین ایران. ما تکیه‌گاه دیجیتال شما هستیم.
            </p>
            <div className="flex items-center gap-4 justify-start">
              <a
                href={BALE_SUPPORT_ACCOUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="پشتیبانی بله inShop"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-stone-600 font-bold hover:text-rose-600 border border-stone-200 transition-colors text-xs"
              >
                بله
              </a>
              <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-stone-400 hover:text-rose-600 border border-stone-200 transition-colors">
                <Globe size={20} />
              </a>
            </div>
          </div>
          
          <div className="text-right">
            <h4 className="font-bold text-stone-900 mb-6">پشتیبانی</h4>
            <p className="text-stone-500 mb-2">تلفن:</p>
            <a href="tel:+982191099961" className="text-lg font-bold text-stone-900 mb-6 block hover:text-rose-600 transition-colors" dir="ltr">۰۲۱-۹۱۰۹۹۹۶۱</a>
          </div>
        </div>
        
        <div className="pt-8 border-t border-stone-200 text-center text-sm text-stone-400">
          © ۱۴۰۵ تمامی حقوق برای برند inShop محفوظ است. توسعه یافته برای حمایت از اقتصاد دیجیتال.
        </div>
      </div>
    </footer>
  );
};
