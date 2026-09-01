import Image from 'next/image';

export interface AppLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function AppLogo({
  className = '',
  width = 188,
  height = 48,
  priority = true,
}: AppLogoProps) {
  return (
    <div className={`flex justify-center select-none ${className}`}>
      <div className="flex flex-col items-center">
        <Image
          quality={100}
          src="/logo/inshop-logo.png"
          loading={priority ? 'eager' : 'lazy'}
          alt="لوگوی برند اینشاپ"
          width={width}
          height={height}
          className="h-auto w-auto object-contain"
        />
      </div>
    </div>
  );
}
