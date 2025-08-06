import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Types
export interface Booth {
  id: string;
  couple_name: string;
  wedding_date: string;
  email: string;
  booth_code: string;
  is_public: boolean;
  requires_approval: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuestSubmission {
  id: string;
  booth_id: string;
  guest_name?: string;
  message: string;
  media_url?: string;
  media_type: "photo" | "video";
  is_approved: boolean;
  created_at: string;
}

export interface BoothStats {
  total_photos: number;
  total_videos: number;
  total_messages: number;
  pending_approvals: number;
}

export interface CreateBoothData {
  couple_name: string;
  wedding_date: string;
  email: string;
  is_public?: boolean;
  requires_approval?: boolean;
  email_notifications?: boolean;
}

export interface UpdateBoothData {
  couple_name?: string;
  wedding_date?: string;
  email?: string;
  is_public?: boolean;
  requires_approval?: boolean;
  email_notifications?: boolean;
}

// Booth Queries
export const useBooth = (boothId?: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["booth", boothId],
    queryFn: async () => {
      if (!boothId) return null;

      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("id", boothId)
        .single();

      if (error) throw error;
      return data as Booth;
    },
    enabled: !!boothId,
  });
};

export const useUserBooth = () => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-booth"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as Booth;
    },
  });
};

export const useCreateBooth = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateBoothData) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate unique booth code
      const boothCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      const { data: booth, error } = await supabase
        .from("booths")
        .insert({
          ...data,
          user_id: user.id,
          booth_code: boothCode,
          is_public: data.is_public ?? false,
          requires_approval: data.requires_approval ?? true,
          email_notifications: data.email_notifications ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return booth as Booth;
    },
    onSuccess: (booth) => {
      queryClient.invalidateQueries({ queryKey: ["user-booth"] });
      toast.success("Booth created successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create booth");
    },
  });
};

export const useUpdateBooth = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boothId,
      data,
    }: {
      boothId: string;
      data: UpdateBoothData;
    }) => {
      const { data: booth, error } = await supabase
        .from("booths")
        .update(data)
        .eq("id", boothId)
        .select()
        .single();

      if (error) throw error;
      return booth as Booth;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-booth"] });
      toast.success("Booth updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update booth");
    },
  });
};

// Booth Stats
export const useBoothStats = (boothId?: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["booth-stats", boothId],
    queryFn: async (): Promise<BoothStats> => {
      if (!boothId) throw new Error("Booth ID required");

      const { data: submissions, error } = await supabase
        .from("guest_submissions")
        .select("media_type, is_approved")
        .eq("booth_id", boothId);

      if (error) throw error;

      const stats: BoothStats = {
        total_photos: 0,
        total_videos: 0,
        total_messages: submissions?.length || 0,
        pending_approvals: 0,
      };

      submissions?.forEach((submission) => {
        if (submission.media_type === "photo") stats.total_photos++;
        if (submission.media_type === "video") stats.total_videos++;
        if (!submission.is_approved) stats.pending_approvals++;
      });

      return stats;
    },
    enabled: !!boothId,
  });
};

// Guest Submissions
export const useGuestSubmissions = (boothId?: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["guest-submissions", boothId],
    queryFn: async () => {
      if (!boothId) return [];

      const { data, error } = await supabase
        .from("guest_submissions")
        .select("*")
        .eq("booth_id", boothId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GuestSubmission[];
    },
    enabled: !!boothId,
  });
};

export const useRecentSubmissions = (boothId?: string, limit: number = 5) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["recent-submissions", boothId, limit],
    queryFn: async () => {
      if (!boothId) return [];

      const { data, error } = await supabase
        .from("guest_submissions")
        .select("*")
        .eq("booth_id", boothId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as GuestSubmission[];
    },
    enabled: !!boothId,
  });
};

export const useApproveSubmission = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data, error } = await supabase
        .from("guest_submissions")
        .update({ is_approved: true })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data as GuestSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["booth-stats"] });
      toast.success("Submission approved!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve submission");
    },
  });
};

export const useDeleteSubmission = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      // First get the submission to delete the media file
      const { data: submission, error: fetchError } = await supabase
        .from("guest_submissions")
        .select("media_url")
        .eq("id", submissionId)
        .single();

      if (fetchError) throw fetchError;

      // Delete media file from storage if it exists
      if (submission.media_url) {
        const { error: storageError } = await supabase.storage
          .from("guest-media")
          .remove([submission.media_url]);

        if (storageError) {
          console.error("Failed to delete media file:", storageError);
        }
      }

      // Delete the submission record
      const { error } = await supabase
        .from("guest_submissions")
        .delete()
        .eq("id", submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["booth-stats"] });
      toast.success("Submission deleted!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete submission");
    },
  });
};

// Public Booth Access
export const usePublicBooth = (boothCode: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["public-booth", boothCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .eq("booth_code", boothCode)
        .single();

      if (error) throw error;
      return data as Booth;
    },
    enabled: !!boothCode,
  });
};

export const usePublicSubmissions = (boothId?: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["public-submissions", boothId],
    queryFn: async () => {
      if (!boothId) return [];

      const { data, error } = await supabase
        .from("guest_submissions")
        .select("*")
        .eq("booth_id", boothId)
        .eq("is_approved", true)
        .not("media_url", "is", null) // Only submissions with media
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GuestSubmission[];
    },
    enabled: !!boothId,
  });
};
