import { text } from '../constants';

export default function RejectionDetailsList() {
  return (
    <div className="mt-4 border-t border-zinc-100 pt-3 text-right w-full">
      <h5 className="font-bold text-[11px] text-zinc-800 mb-1.5 font-sans">راه‌های پیشگیری و اصلاح:</h5>
      <ul className="list-disc list-inside text-[9.5px] text-zinc-500 space-y-1 font-sans">
        {text.rejectionTips.map((tip) => (
          <li key={tip} className="leading-relaxed">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
