import { queryKeys } from "@/lib/query-keys";
import { http } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

export interface UploadSessionData {
  uploadSessionId: string;
  expiresAt: string;
}

async function fetchUploadSession(): Promise<UploadSessionData> {
  const res = await http.post<UploadSessionData>('/upload-sessions');
  if (!res.ok) throw new Error(res.error.message);

  return res.value;
}

export function useUploadSession() {
  return useQuery({
    queryKey: queryKeys.posts.uploadSession(),
    queryFn: fetchUploadSession,
    staleTime: Infinity,
  });
}
