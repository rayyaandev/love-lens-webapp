"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  useUserBooth,
  useGuestSubmissions,
  useApproveSubmission,
  useDeleteSubmission,
} from "@/queries/booth";
import { Camera, Video, Check, X, Download, Filter, Trash } from "lucide-react";
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
  const [modalImage, setModalImage] = useState<{
    url: string;
    type: string;
  } | null>(null);

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

  const downloadSingleFile = async (url: string, submission: any) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const guestName = submission.guest_name || "anonymous";
      const date = new Date(submission.created_at).toISOString().split("T")[0];
      const fileExt = url.split(".").pop();
      link.download = `${guestName}-${date}-${submission.id}.${fileExt}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download file");
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
                  <Trash className="w-4 h-4 mr-2" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`bg-card rounded-lg border border-border overflow-hidden group ${
                    selectedSubmissions.has(submission.id)
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                >
                  {/* Media preview */}
                  <div
                    className="aspect-[4/3] bg-muted relative cursor-pointer"
                    onClick={() => {
                      if (isSelectMode) {
                        handleSelectSubmission(submission.id);
                      } else if (submission.media_url) {
                        setModalImage({
                          url: submission.media_url,
                          type: submission.media_type || "photo",
                        });
                      }
                    }}
                  >
                    {submission.media_url ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {submission.media_type === "photo" ? (
                          <Image
                            src={submission.media_url}
                            alt="Guest submission"
                            width={150}
                            height={112}
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
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <Video className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Selection checkbox */}
                    {isSelectMode && (
                      <div className="absolute top-1 left-1 z-10">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={() => handleSelectSubmission(submission.id)}
                          className="w-3 h-3 text-primary bg-background border-gray-300 rounded focus:ring-primary focus:ring-1"
                          id="selection-mode"
                        />
                      </div>
                    )}

                    {/* Approval status badge */}
                    {!submission.is_approved && (
                      <div className="absolute top-1 right-1 bg-orange-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                        Pending
                      </div>
                    )}

                    {/* Hover overlay with action buttons */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {submission.media_url && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadSingleFile(
                              submission.media_url!,
                              submission
                            );
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {!submission.is_approved && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => {
                            e.stopPropagation();
                            approveSubmission.mutate(submission.id);
                          }}
                          disabled={approveSubmission.isPending}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubmission.mutate(submission.id);
                        }}
                        disabled={deleteSubmission.isPending}
                        className="h-8 w-8 p-0"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Submission details */}
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground text-xs truncate">
                        {submission.guest_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              {modalImage.type === "photo" ? (
                <Image
                  src={modalImage.url}
                  alt="Full size image"
                  width={800}
                  height={600}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : (
                <video
                  src={modalImage.url}
                  controls
                  className="max-w-full max-h-[80vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
