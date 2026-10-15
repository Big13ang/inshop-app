export const MockupApp = () => {
  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      {/* Live inShop home inside a phone frame */}
      <div className="bg-white rounded-[3rem] shadow-2xl border-[8px] border-stone-900 overflow-hidden aspect-[9/19] flex flex-col relative">
        <iframe
          src="/"
          loading="lazy"
          title="پیش‌نمایش اپلیکیشن inShop"
          tabIndex={-1}
          className="pointer-events-none w-full h-full flex-1 border-0 bg-white"
        />
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[radial-gradient(circle,var(--color-rose-100),transparent_70%)] rounded-full -z-10" />
    </div>
  );
};
