import { cn } from "@/lib/utils";

export type PhoneNumberBadgeProps = {
  phoneNumberBadge?: string;
  className?: string;
};

export default function PhoneNumberBadge({
  phoneNumberBadge,
  className,
}: PhoneNumberBadgeProps) {
  if (!phoneNumberBadge) return null;

  return (
    <label className={cn("text-xs font-semibold text-zinc-600 block text-right pr-0.5 w-full", className)}>
      کد ارسال شده به{" "}
      <span className="font-bold text-zinc-900 tracking-wider font-mono mx-0.5" dir="ltr">
        {phoneNumberBadge}
      </span>{" "}
      را وارد کنید
    </label>
  );
}




