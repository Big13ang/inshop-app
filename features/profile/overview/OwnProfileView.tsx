'use client';

import ProfileView from './ProfileView';
import { useUser } from '../context/UserContext';

export default function OwnProfileView() {
  const { user: me } = useUser();

  if (!me?.sellerProfile) return null;

  return <ProfileView profile={me.sellerProfile} isOwner={true} />;
}
