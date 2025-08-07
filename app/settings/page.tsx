"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  useUserBooth,
  useUpdateBooth,
  useGuestSubmissions,
} from "@/queries/booth";
import {
  Heart,
  Copy,
  QrCode,
  Eye,
  EyeOff,
  Bell,
  Shield,
  Download,
  Archive,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import QRCode from "qrcode";
import Image from "next/image";

export default function SettingsPage() {
  const { data: booth, isLoading: boothLoading } = useUserBooth();
  const { data: submissions } = useGuestSubmissions(booth?.id);
  const updateBooth = useUpdateBooth();

  const [isEditing, setIsEditing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState<{
    couple_name: string;
    wedding_date: string;
    email: string;
    is_public: boolean;
    requires_approval: boolean;
    email_notifications: boolean;
  }>({
    couple_name: booth?.couple_name || "",
    wedding_date: booth?.wedding_date || "",
    email: booth?.email || "",
    is_public: booth?.is_public || false,
    requires_approval: booth?.requires_approval || true,
    email_notifications: booth?.email_notifications || true,
  });

  // Update form data when booth data changes
  useEffect(() => {
    if (booth) {
      setFormData({
        couple_name: booth.couple_name,
        wedding_date: booth.wedding_date,
        email: booth.email,
        is_public: booth.is_public,
        requires_approval: booth.requires_approval,
        email_notifications: booth.email_notifications,
      });
    }
  }, [booth]);

  // Generate QR code when booth URL is available
  useEffect(() => {
    if (booth?.booth_code) {
      const boothUrl = `${window.location.origin}/booth/${booth.booth_code}`;
      QRCode.toDataURL(boothUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#6B4F4F",
          light: "#F5EFE6",
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("QR Code generation failed:", err);
        });
    }
  }, [booth?.booth_code]);

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

  const boothUrl = `${window.location.origin}/booth/${booth.booth_code}`;

  const copyBoothUrl = async () => {
    try {
      await navigator.clipboard.writeText(boothUrl);
      toast.success("Booth URL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement("a");
      link.download = `${booth.couple_name}-booth-qr.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const downloadAllSubmissions = async () => {
    if (!submissions || submissions.length === 0) {
      toast.error("No submissions to download");
      return;
    }

    setIsDownloading(true);

    try {
      // Import JSZip dynamically to avoid SSR issues
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Filter submissions that have media files
      const submissionsWithMedia = submissions.filter((sub) => sub.media_url);

      if (submissionsWithMedia.length === 0) {
        toast.error("No media files to download");
        return;
      }

      // Download each media file and add to zip
      for (const submission of submissionsWithMedia) {
        try {
          const response = await fetch(submission.media_url!);
          const blob = await response.blob();

          // Create filename with guest name and timestamp
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

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${booth.couple_name}-submissions-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${submissionsWithMedia.length} files!`);
    } catch (error) {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to download submissions");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = () => {
    updateBooth.mutate(
      {
        boothId: booth.id,
        data: formData,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setFormData({
      couple_name: booth.couple_name,
      wedding_date: booth.wedding_date,
      email: booth.email,
      is_public: booth.is_public,
      requires_approval: booth.requires_approval,
      email_notifications: booth.email_notifications,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b p-6">
          <h1 className="text-xl font-semibold text-foreground">
            Booth Settings
          </h1>

          {isEditing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateBooth.isPending}>
                {updateBooth.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </header>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl space-y-8">
            {/* Booth Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Booth Information
                </h2>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="couple_name">Couple Name</Label>
                  {isEditing ? (
                    <Input
                      id="couple_name"
                      value={formData.couple_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          couple_name: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{booth.couple_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="wedding_date">Wedding Date</Label>
                  {isEditing ? (
                    <Input
                      id="wedding_date"
                      type="date"
                      value={formData.wedding_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          wedding_date: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">
                      {new Date(booth.wedding_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-foreground mt-1">{booth.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Booth Access */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <QrCode className="w-5 h-5 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  Booth Access
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <Label>Booth Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono text-foreground">
                      {booth.booth_code}
                    </code>
                  </div>
                </div>

                <div>
                  <Label>Booth URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      value={boothUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={copyBoothUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div>
                  <Label>QR Code</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {qrCodeUrl && (
                      <div className="bg-white p-4 rounded-lg border">
                        <Image
                          width={128}
                          height={128}
                          src={qrCodeUrl}
                          alt="Booth QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadQRCode}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Print this QR code and place it at your wedding for easy
                        access
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Submissions */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Archive className="w-5 h-5 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  Download Submissions
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    All Guest Submissions
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all photos and videos from guest submissions as a
                    ZIP file
                  </p>
                  <Button
                    variant="outline"
                    onClick={downloadAllSubmissions}
                    disabled={
                      isDownloading || !submissions || submissions.length === 0
                    }
                    className="w-full"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    {isDownloading
                      ? "Creating ZIP..."
                      : "Download All Submissions"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Privacy Settings
                  </h2>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Public Booth
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow guests to view all approved submissions
                    </p>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_public: checked }))
                      }
                      className="data-[state=unchecked]:bg-gray-300"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {booth.is_public ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {booth.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Require Approval
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Review submissions before they appear
                    </p>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={formData.requires_approval}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          requires_approval: checked,
                        }))
                      }
                      className="data-[state=unchecked]:bg-gray-300"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {booth.requires_approval ? (
                        <Shield className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Heart className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {booth.requires_approval
                          ? "Approval Required"
                          : "Auto-approve"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when new submissions arrive
                    </p>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={formData.email_notifications}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          email_notifications: checked,
                        }))
                      }
                      className="data-[state=unchecked]:bg-gray-300"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {booth.email_notifications ? (
                        <Bell className="w-4 h-4 text-green-600" />
                      ) : (
                        <Bell className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {booth.email_notifications ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
