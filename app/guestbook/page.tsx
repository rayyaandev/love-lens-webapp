"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  useUserBooth,
  useGuestSubmissions,
  useApproveSubmission,
  useDeleteSubmission,
} from "@/queries/booth";
import {
  MessageSquare,
  Check,
  X,
  Filter,
  Download,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function GuestbookPage() {
  const { data: booth, isLoading: boothLoading } = useUserBooth();
  const { data: submissions, isLoading: submissionsLoading } =
    useGuestSubmissions(booth?.id);
  const approveSubmission = useApproveSubmission();
  const deleteSubmission = useDeleteSubmission();

  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");

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
      // Filter by approval status
      if (filter === "approved" && !submission.is_approved) return false;
      if (filter === "pending" && submission.is_approved) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          submission.guest_name?.toLowerCase().includes(searchLower) ||
          submission.message.toLowerCase().includes(searchLower)
        );
      }

      return true;
    }) || [];

  const exportMessages = () => {
    const approvedMessages = submissions?.filter((s) => s.is_approved) || [];
    const csvContent = [
      "Guest Name,Message,Date,Media Type",
      ...approvedMessages.map(
        (s) =>
          `"${s.guest_name || "Anonymous"}","${s.message.replace(/"/g, '""')}","${new Date(s.created_at).toLocaleDateString()}","${s.media_type || "text only"}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${booth.couple_name}-guestbook-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">Guestbook</h1>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportMessages}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search messages or guest names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

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
                variant={filter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("approved")}
              >
                Approved (
                {submissions?.filter((s) => s.is_approved).length || 0})
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending (
                {submissions?.filter((s) => !s.is_approved).length || 0})
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          {submissionsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm
                  ? "No messages found"
                  : `No ${filter === "all" ? "" : filter} messages yet`}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : filter === "pending"
                    ? "All messages have been approved!"
                    : "Share your booth link with guests to get started!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-card rounded-lg border border-border p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold text-foreground">
                          {submission.guest_name || "Anonymous"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(submission.created_at).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(submission.created_at).toLocaleTimeString()}
                        </span>
                        {submission.media_type && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {submission.media_type === "photo"
                              ? "📷 Photo"
                              : "🎥 Video"}
                          </span>
                        )}
                        {!submission.is_approved && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Pending Approval
                          </span>
                        )}
                      </div>

                      <p className="text-foreground leading-relaxed mb-4">
                        {submission.message}
                      </p>

                      {submission.media_url && (
                        <div className="mb-4">
                          <a
                            href={submission.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            View attached media
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
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
