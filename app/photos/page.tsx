"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  useUserBooth,
  useGuestSubmissions,
  useApproveSubmission,
  useDeleteSubmission,
} from "@/queries/booth";
import { Camera, Video, Check, X, Download, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function PhotosPage() {
  const { data: booth, isLoading: boothLoading } = useUserBooth();
  const { data: submissions, isLoading: submissionsLoading } =
    useGuestSubmissions(booth?.id);
  const approveSubmission = useApproveSubmission();
  const deleteSubmission = useDeleteSubmission();

  const [filter, setFilter] = useState<"all" | "photo" | "video" | "pending">(
    "all"
  );
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );

  if (boothLoading) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Booth Found
              </h2>
              <p className="text-muted-foreground">
                You haven&apos;t created a booth yet.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const filteredSubmissions =
    submissions?.filter((submission) => {
      if (filter === "photo") return submission.media_type === "photo";
      if (filter === "video") return submission.media_type === "video";
      if (filter === "pending") return !submission.is_approved;
      return true;
    }) || [];

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">
            Photos & Videos
          </h1>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({submissions?.length || 0})
            </Button>
            <Button
              variant={filter === "photo" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("photo")}
            >
              Photos (
              {submissions?.filter((s) => s.media_type === "photo").length || 0}
              )
            </Button>
            <Button
              variant={filter === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("video")}
            >
              Videos (
              {submissions?.filter((s) => s.media_type === "video").length || 0}
              )
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              Pending ({submissions?.filter((s) => !s.is_approved).length || 0})
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 p-6">
          {submissionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">
                Loading submissions...
              </div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No {filter === "all" ? "submissions" : filter}s yet
              </h3>
              <p className="text-muted-foreground">
                {filter === "pending"
                  ? "All submissions have been approved!"
                  : "Share your booth link with guests to get started!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  {/* Media preview */}
                  <div className="aspect-square bg-muted relative group">
                    {submission.media_url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {submission.media_type === "photo" ? (
                          <img
                            src={submission.media_url}
                            alt="Guest submission"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={submission.media_url}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {submission.media_type === "photo" ? (
                          <Camera className="w-12 h-12 text-muted-foreground" />
                        ) : (
                          <Video className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {submission.media_url && (
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {!submission.is_approved && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            approveSubmission.mutate(submission.id)
                          }
                          disabled={approveSubmission.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSubmission.mutate(submission.id)}
                        disabled={deleteSubmission.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Approval status badge */}
                    {!submission.is_approved && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Submission details */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        {submission.guest_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
