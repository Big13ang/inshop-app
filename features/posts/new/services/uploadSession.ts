import { queryKeys } from "@/lib/query-keys";
import { http } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMediaStore } from "./mediaStore";
import { useEffect } from "react";

export interface UploadSessionData {
  uploadSessionId: string;
  expiresAt: string;
}

export async function fetchUploadSession(): Promise<UploadSessionData> {
  const res = await http.post<UploadSessionData>('/upload-sessions');
  if (!res.ok) throw new Error(res.error.message);

  return res.value;
}

export function useUploadSession() {
  const uploadSessionId = useMediaStore((s) => s.uploadSessionId);
  const setUploadSessionId = useMediaStore((s) => s.setUploadSessionId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uploadSessionId) {
      queryClient.removeQueries({ queryKey: queryKeys.posts.uploadSession() });
    }
  }, [uploadSessionId, queryClient]);

  const query = useQuery({
    queryKey: queryKeys.posts.uploadSession(),
    queryFn: async () => {
      const data = await fetchUploadSession();
      setUploadSessionId(data.uploadSessionId);
      return data;
    },
    enabled: !uploadSessionId,
    staleTime: 0,
    gcTime: 0,
  });

  if (uploadSessionId) {
    return {
      data: { uploadSessionId, expiresAt: '' },
      isPending: false,
      isLoading: false,
      isSuccess: true,
      error: null,
      refetch: query.refetch,
    };
  }

  return query;
}
