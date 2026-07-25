import { cn } from '@/lib/utils';

export interface ProfileStatsRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

function ProfileStatsRoot({ children, className, ...props }: ProfileStatsRootProps) {
  return (
    <div
      className={cn('flex flex-1 items-center justify-around pb-2 text-primary', className)}
      dir="rtl"
      {...props}
    >
      {children}
    </div>
  );
}

export interface ProfileStatsItemProps {
  value: number | string;
  label: string;
}

function ProfileStatsItem({ value, label }: ProfileStatsItemProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-bold text-primary">{value}</span>
      <span className="text-[10px] text-secondary">{label}</span>
    </div>
  );
}

function ProfileStatsDivider() {
  return <div className="h-6 w-px self-center bg-container-base" aria-hidden="true" />;
}

export const ProfileStats = {
  Root: ProfileStatsRoot,
  Item: ProfileStatsItem,
  Divider: ProfileStatsDivider,
};

export default ProfileStats;
