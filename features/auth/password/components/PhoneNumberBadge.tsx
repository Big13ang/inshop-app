export type PhoneNumberBadgeProps = {
  phoneNumberBadge?: string;
  onEditPhone?: () => void;
};

export default function PhoneNumberBadge({
  phoneNumberBadge,
  onEditPhone,
}: PhoneNumberBadgeProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      <span className="text-xs font-sans font-medium text-zinc-800 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80">
        {phoneNumberBadge}
      </span>
      {onEditPhone && (
        <button
          type="button"
          onClick={onEditPhone}
          className="text-xs text-zinc-500 hover:text-zinc-950 transition font-medium underline underline-offset-4 cursor-pointer"
        >
          ویرایش شماره
        </button>
      )}
    </div>
  );
}
