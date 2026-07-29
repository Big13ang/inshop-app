import Image from "next/image";

export default function AppLogo() {
    return (
        <div className="flex justify-center pt-8">
            <div className="flex flex-col items-center">
                <Image quality={100} src="/logo/inshop-logo.png" loading="eager" alt="لوگوی برند اینشاپ" width={188} height={48} className='h-auto' />
            </div>
        </div>
    );
}
