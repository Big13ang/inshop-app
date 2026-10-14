import Image from 'next/image';

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-stone-900 text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="text-rose-500 font-bold mb-4">داستان ما</h2>
          <h3 className="text-4xl md:text-5xl font-display mb-8">فراتر از یک پلتفرم، یک خانواده هستیم</h3>
          <div className="space-y-6 text-stone-300 text-lg leading-relaxed">
            <p>
              ما در برند "CARONLINE" طی چندین سال فعالیت مستمر، توانستیم اعتماد  یک میلیونی کاربر فعال را جلب کنیم. زمانی که دیدیم کسب‌وکارهای کوچک و محلی به خاطر فیلترینگ اینستاگرام صدمه می‌بینند، تصمیم گرفتیم این زیرساخت را فراهم کنیم.
            </p>
            <p>
              هدف ما ساده است: هیچ ایرانی نباید به خاطر محدودیت‌های اینترنتی، از کسب درآمد و رسیدن به رویاهایش باز بماند. ما تمام تکنولوژی و تیممان را در اختیار شما گذاشتیم تا فقط روی کیفیت محصولاتتان تمرکز کنید.
            </p>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="rounded-[4rem] overflow-hidden border-8 border-white/5 rotate-3 hover:rotate-0 transition-transform duration-700 shadow-2xl">
            <Image
              src="/campaign/images/we-are-a-family.webp"
              alt="Persian Community Support"
              width={2048}
              height={2048}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-full object-cover aspect-square"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
