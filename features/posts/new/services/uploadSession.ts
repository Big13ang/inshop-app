import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { useMediaStore } from './mediaStore';

export interface UploadSessionData {
  uploadSessionId: string;
  expiresAt: string;
}

async function fetchUploadSession(): Promise<UploadSessionData> {
  const res = await http.post<UploadSessionData>('/upload-sessions');
  if (!res.ok) throw new Error(res.error.message);

  return res.value;
}

function syncUploadSession(data: UploadSessionData | undefined) {
  if (!data) return;

  useMediaStore
    .getState()
    .setUploadSession(data.uploadSessionId, data.expiresAt);
}

export function useUploadSession() {
  const uploadSessionId = useMediaStore((s) => s.uploadSessionId);
  const query = useQuery({
    queryKey: queryKeys.posts.uploadSession(),
    queryFn: fetchUploadSession,
    enabled: !uploadSessionId,
    staleTime: Infinity,
  });

  useEffect(() => syncUploadSession(query.data), [query.data]);

  return query;
}
