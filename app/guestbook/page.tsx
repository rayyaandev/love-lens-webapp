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
  Trash,
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
      // Only show submissions with messages
      if (!submission.message || submission.message.trim() === "") return false;

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
    const approvedMessages =
      submissions?.filter(
        (s) => s.is_approved && s.message && s.message.trim() !== ""
      ) || [];
    const csvContent = [
      "Guest Name,Message,Date",
      ...approvedMessages.map(
        (s) =>
          `"${s.guest_name || "Anonymous"}","${s.message.replace(/"/g, '""')}","${new Date(s.created_at).toLocaleDateString()}"`
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

  // Get submissions with messages for counters
  const submissionsWithMessages =
    submissions?.filter((s) => s.message && s.message.trim() !== "") || [];

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
                All ({submissionsWithMessages.length})
              </Button>
              <Button
                variant={filter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("approved")}
              >
                Approved (
                {submissionsWithMessages.filter((s) => s.is_approved).length})
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending (
                {submissionsWithMessages.filter((s) => !s.is_approved).length})
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  {/* Message content */}
                  <div className="p-4 h-48 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm truncate">
                        {submission.guest_name || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {!submission.is_approved && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded mb-2 self-start">
                        Pending
                      </span>
                    )}

                    <div className="flex-1 overflow-y-auto pr-2">
                      <p className="text-foreground text-sm leading-relaxed">
                        {submission.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
                      {!submission.is_approved && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            approveSubmission.mutate(submission.id)
                          }
                          disabled={approveSubmission.isPending}
                          className="h-7 w-7 p-0 flex-1"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSubmission.mutate(submission.id)}
                        disabled={deleteSubmission.isPending}
                        className="h-7 w-7 p-0 flex-1"
                      >
                        <Trash className="w-3 h-3" />
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
