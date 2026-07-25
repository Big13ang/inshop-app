import { Store } from 'lucide-react';
import { text } from '../constants';

export default function SellerPanelBanner() {
  return (
    <div dir="rtl" className="flex items-center gap-3 px-4 py-3 bg-surface-l3 border-b border-outline/30">
      <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center">
        <Store className="w-4 h-4 text-on-primary" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-bold text-foreground">{text.sellerPanelBadge}</span>
        <span className="text-xs text-secondary leading-relaxed truncate">{text.sellerPanelDesc}</span>
      </div>
    </div>
  );
}
