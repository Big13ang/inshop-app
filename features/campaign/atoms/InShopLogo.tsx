import Image from 'next/image';

export const InShopLogo = () => {
  return (
    <Image
      quality={100}
      src="/logo/inshop-logo.png"
      loading="eager"
      alt="لوگوی برند اینشاپ"
      width={1278}
      height={553}
      className="h-8 md:h-10 w-auto"
    />
  );
};
