"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  useUserBooth,
  useBoothStats,
  useRecentSubmissions,
} from "@/queries/booth";
import { Camera, Video, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: booth, isLoading: boothLoading } = useUserBooth();
  const { data: stats, isLoading: statsLoading } = useBoothStats(booth?.id);
  const { data: recentSubmissions, isLoading: submissionsLoading } =
    useRecentSubmissions(booth?.id, 5);

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
              <p className="text-muted-foreground mb-4">
                You haven&apos;t created a booth yet.
              </p>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => (window.location.href = "/create-booth")}
              >
                Create Booth
              </Button>
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
        <header className="flex h-16 items-center gap-2 border-b p-6">
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        </header>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="grid gap-6">
            {/* Welcome section */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Welcome, {booth.couple_name}!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your wedding is on{" "}
                {new Date(booth.wedding_date).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Booth Code: {booth.booth_code}</span>
                <span>•</span>
                <span>{booth.is_public ? "Public" : "Private"} Booth</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Photos
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.total_photos || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Videos
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.total_videos || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Messages
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.total_messages || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {statsLoading ? "..." : stats?.pending_approvals || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent submissions */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Submissions
              </h3>
              {submissionsLoading ? (
                <div className="text-muted-foreground">
                  Loading recent submissions...
                </div>
              ) : recentSubmissions && recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border"
                    >
                      {submission.media_url && (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          {submission.media_type === "photo" ? (
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <Video className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">
                            {submission.guest_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              submission.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {submission.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No submissions yet</p>
                  <p className="text-sm">
                    Share your booth link with guests to get started!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
