interface VerifiedBadgeProps {
  className?: string;
}

export default function VerifiedBadge({ className = 'h-4 w-4' }: VerifiedBadgeProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-label="تایید شده">
      <path
        fill="#3897F0"
        d="M19.998 3.094 24.674.85l2.07 4.318 4.717.692.692 4.717 4.318 2.07-2.245 4.353 2.245 4.353-4.318 2.07-.692 4.717-4.717.692-2.07 4.318-4.676-2.245-4.677 2.245-2.07-4.318-4.717-.692-.692-4.717-4.318-2.07 2.245-4.353-2.245-4.353 4.318-2.07.692-4.717 4.717-.692 2.07-4.318 4.677 2.245Z"
      />
      <path
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m13.5 20.5 4 4 9-9"
      />
    </svg>
  );
}
