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
import { toast } from "sonner";

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
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Filter out submissions without media and apply current filter
  const mediaSubmissions =
    submissions?.filter((submission) => submission.media_url) || [];

  const filteredSubmissions = mediaSubmissions.filter((submission) => {
    if (filter === "photo") return submission.media_type === "photo";
    if (filter === "video") return submission.media_type === "video";
    if (filter === "pending") return !submission.is_approved;
    return true;
  });

  const handleSelectSubmission = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  const handleBulkApprove = async () => {
    const pendingSubmissions = filteredSubmissions.filter(
      (s) => selectedSubmissions.has(s.id) && !s.is_approved
    );

    for (const submission of pendingSubmissions) {
      await approveSubmission.mutateAsync(submission.id);
    }
    setSelectedSubmissions(new Set());
    setIsSelectMode(false);
  };

  const handleBulkDelete = async () => {
    const submissionsToDelete = filteredSubmissions.filter((s) =>
      selectedSubmissions.has(s.id)
    );

    for (const submission of submissionsToDelete) {
      await deleteSubmission.mutateAsync(submission.id);
    }
    setSelectedSubmissions(new Set());
    setIsSelectMode(false);
  };

  const handleBulkDownload = async () => {
    const submissionsToDownload = filteredSubmissions.filter(
      (s) => selectedSubmissions.has(s.id) && s.media_url
    );

    try {
      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      for (const submission of submissionsToDownload) {
        try {
          const response = await fetch(submission.media_url!);
          const blob = await response.blob();

          const guestName = submission.guest_name || "anonymous";
          const date = new Date(submission.created_at)
            .toISOString()
            .split("T")[0];
          const fileExt = submission.media_url!.split(".").pop();
          const filename = `${guestName}-${date}-${submission.id}.${fileExt}`;

          zip.file(filename, blob);
        } catch (error) {
          console.error(
            `Failed to download file: ${submission.media_url}`,
            error
          );
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `selected-submissions-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${submissionsToDownload.length} files!`);
    } catch (error) {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to download submissions");
    }
  };

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

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">
            Photos & Videos
          </h1>

          <div className="flex items-center gap-2">
            {/* Multi-select controls */}
            {isSelectMode && (
              <>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedSubmissions.size === filteredSubmissions.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={
                    !Array.from(selectedSubmissions).some((id) =>
                      filteredSubmissions.find(
                        (s) => s.id === id && !s.is_approved
                      )
                    )
                  }
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve (
                  {
                    Array.from(selectedSubmissions).filter((id) =>
                      filteredSubmissions.find(
                        (s) => s.id === id && !s.is_approved
                      )
                    ).length
                  }
                  )
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                  disabled={selectedSubmissions.size === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download ({selectedSubmissions.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedSubmissions.size === 0}
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete ({selectedSubmissions.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedSubmissions(new Set());
                  }}
                >
                  Cancel
                </Button>
              </>
            )}

            {/* Select mode toggle and filter buttons */}
            {!isSelectMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectMode(true)}
                >
                  Select Multiple
                </Button>
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All ({mediaSubmissions.length})
                </Button>
                <Button
                  variant={filter === "photo" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("photo")}
                >
                  Photos (
                  {
                    mediaSubmissions.filter((s) => s.media_type === "photo")
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={filter === "video" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("video")}
                >
                  Videos (
                  {
                    mediaSubmissions.filter((s) => s.media_type === "video")
                      .length
                  }
                  )
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  Pending (
                  {mediaSubmissions.filter((s) => !s.is_approved).length})
                </Button>
              </>
            )}
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
                  className={`bg-card rounded-lg border border-border overflow-hidden ${
                    selectedSubmissions.has(submission.id)
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                >
                  {/* Media preview */}
                  <div
                    className={`aspect-square bg-muted relative group ${isSelectMode ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (isSelectMode) {
                        handleSelectSubmission(submission.id);
                      }
                    }}
                  >
                    {submission.media_url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {submission.media_type === "photo" ? (
                          <Image
                            src={submission.media_url}
                            alt="Guest submission"
                            width={300}
                            height={300}
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

                    {/* Selection checkbox */}
                    {isSelectMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={() => handleSelectSubmission(submission.id)}
                          className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary focus:ring-2"
                          id="selection-mode"
                        />
                      </div>
                    )}

                    {/* Approval status badge */}
                    {!submission.is_approved && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {submission.message}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {submission.media_url && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <Download className="w-3 h-3" />
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
                          className="flex-1"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSubmission.mutate(submission.id)}
                        disabled={deleteSubmission.isPending}
                        className="flex-1"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
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
