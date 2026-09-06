import type { SearchProfileDto } from '../types';
import { AccountCard } from './AccountCard';

interface AccountsSectionProps {
  profiles: SearchProfileDto[];
}

export function AccountsSection({
  profiles,
}: AccountsSectionProps) {
  const displayProfiles = profiles.slice(0, 4);

  if (displayProfiles.length === 0) return null;

  return (
    <div className="px-4 py-2 w-full flex flex-col" id="inshop-search-accounts-section">
      {displayProfiles.map((profile) => (
        <AccountCard
          key={profile.id || profile.username}
          profile={profile}
        />
      ))}
    </div>
  );
}

