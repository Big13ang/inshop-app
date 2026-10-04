interface StatsItemProps {
  count: number | string;
  label: string;
}

function _StatsItem({ count, label }: StatsItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bold text-sm text-primary font-sans">{count}</span>
      <span className="text-[10px] text-secondary">{label}</span>
    </div>
  );
}

export interface UserStatsBarProps {
  viewedCount?: number;
  bookmarkedCount?: number;
  ordersCount?: number;
}

export function UserStatsBar({
  viewedCount: _viewedCount = 0,
  bookmarkedCount: _bookmarkedCount = 0,
  ordersCount: _ordersCount = 0,
}: UserStatsBarProps) {
  // Commented out for now
  return null;
  /*
  return (
    <div className="w-full flex items-center justify-around py-2 text-primary" dir="rtl">
      <StatsItem count={viewedCount} label="دیده‌شده" />
      <div className="w-px h-6 bg-outline/20 self-center" />
      <StatsItem count={bookmarkedCount} label="نشان‌شده" />
      <div className="w-px h-6 bg-outline/20 self-center" />
      <StatsItem count={ordersCount} label="سفارش" />
    </div>
  );
  */
}
