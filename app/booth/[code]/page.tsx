"use client";

import { usePublicBooth, usePublicSubmissions } from "@/queries/booth";
import {
  Heart,
  Camera,
  Video,
  Send,
  Upload,
  X,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

interface BoothPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function BoothPage({ params }: BoothPageProps) {
  const { code } = use(params);

  const {
    data: booth,
    isLoading: boothLoading,
    error: boothError,
  } = usePublicBooth(code);
  const { data: submissions } = usePublicSubmissions(booth?.id);
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"submit" | "gallery">("submit");
  const [formData, setFormData] = useState({
    guest_name: "",
    message: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (boothLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  if (boothError || !booth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Booth Not Found
          </h2>
          <p className="text-muted-foreground">
            This booth doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    // Validate all new files
    for (const file of newFiles) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error("Please select only photo or video files");
        return;
      }

      // if (file.size > 10 * 1024 * 1024) {
      //   toast.error("Each file must be less than 10MB");
      //   return;
      // }
    }

    // Append new files to existing ones
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);

    // Create preview URLs for new files and add to existing ones
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    // Remove the file from selectedFiles
    const newSelectedFiles = selectedFiles.filter(
      (_, i) => i !== indexToRemove
    );
    setSelectedFiles(newSelectedFiles);

    // Remove the corresponding preview URL and clean it up
    const urlToRemove = previewUrls[indexToRemove];
    URL.revokeObjectURL(urlToRemove);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== indexToRemove);
    setPreviewUrls(newPreviewUrls);
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
    // Clean up all preview URLs to prevent memory leaks
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      let hasMedia = false;
      let submissionCount = 0;

      // Upload media files if selected
      if (selectedFiles.length > 0) {
        hasMedia = true;
        for (const file of selectedFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("guest-media").upload(fileName, file);

          if (uploadError) {
            throw new Error("Failed to upload media file");
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("guest-media").getPublicUrl(fileName);

          // Create submission for each file
          const { error: submissionError } = await supabase
            .from("guest_submissions")
            .insert({
              booth_id: booth.id,
              guest_name: formData.guest_name || null,
              message: formData.message,
              media_url: publicUrl,
              media_type: file.type.startsWith("image/") ? "photo" : "video",
              is_approved: !booth.requires_approval, // Auto-approve if not required
            });

          if (submissionError) {
            throw new Error("Failed to submit message");
          }
          submissionCount++;
        }
      } else {
        // Create submission without media
        const { error: submissionError } = await supabase
          .from("guest_submissions")
          .insert({
            booth_id: booth.id,
            guest_name: formData.guest_name || null,
            message: formData.message,
            media_url: null,
            media_type: null,
            is_approved: !booth.requires_approval, // Auto-approve if not required
          });

        if (submissionError) {
          throw new Error("Failed to submit message");
        }
        submissionCount = 1;
      }

      // Send email notification if enabled
      if (booth.email_notifications && booth.email) {
        try {
          await fetch("/api/notify-submission", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              boothOwnerEmail: booth.email,
              coupleName: booth.couple_name,
              guestName: formData.guest_name || "Anonymous",
              message: formData.message,
              hasMedia: hasMedia,
            }),
          });
        } catch (error) {
          console.error("Failed to send email notification:", error);
          // Don't fail the submission if email fails
        }
      }

      // Reset form
      setFormData({ guest_name: "", message: "" });
      removeAllFiles();

      toast.success(
        booth.requires_approval
          ? "Message submitted! It will be reviewed before appearing."
          : "Message submitted successfully!"
      );
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadMedia = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                THE LOVE LENS
              </h1>
              <p className="text-sm italic text-muted-foreground font-serif">
                Love. Framed.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-serif text-foreground mb-2">
              {booth.couple_name}
            </h2>
            <p className="text-muted-foreground">
              Wedding on {new Date(booth.wedding_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          <Button
            variant={activeTab === "submit" ? "default" : "ghost"}
            onClick={() => setActiveTab("submit")}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          {booth.is_public && (
            <Button
              variant={activeTab === "gallery" ? "default" : "ghost"}
              onClick={() => setActiveTab("gallery")}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo Gallery
            </Button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "submit" && (
          <div className="bg-card rounded-2xl border border-border p-8">
            <div className="bg-secondary rounded-t-2xl -mt-8 -mx-8 px-8 py-6 mb-6">
              <h3 className="text-xl font-serif text-center text-foreground mb-2">
                Send a photo or video to {booth.couple_name}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Share your memories and well wishes
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Media */}
              <div>
                <Label className="text-base font-medium">
                  Upload Photo or Video (Optional)
                </Label>
                <div className="mt-2">
                  {!selectedFiles.length ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed border-2 border-border hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photos or videos
                        </p>
                        {/* <p className="text-xs text-muted-foreground mt-1">
                          Max 10MB per file
                        </p> */}
                      </div>
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              width={200}
                              height={150}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      {/* Add More Button */}
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-full min-h-[150px] border-dashed border-2 border-border hover:border-primary transition-colors flex flex-col items-center justify-center bg-transparent"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Add More
                          </p>
                        </Button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple // Allow multiple files
                  />
                </div>
              </div>

              {/* Guest Name */}
              <div>
                <Label htmlFor="guest_name">Name (Optional)</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      guest_name: e.target.value,
                    }))
                  }
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Write your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </div>
                )}
              </Button>
            </form>
          </div>
        )}

        {activeTab === "gallery" && booth.is_public && (
          <div className="bg-card rounded-2xl border border-border p-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Photo & Video Gallery
            </h3>
            {submissions && submissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-muted rounded-lg overflow-hidden border border-border"
                  >
                    {/* Media Display */}
                    <div className="aspect-square relative group">
                      {submission.media_url && (
                        <Image
                          src={submission.media_url}
                          alt={`Photo by ${submission.guest_name || "Anonymous"}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Download Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const filename = `${submission.guest_name || "anonymous"}-${submission.media_url?.split(".").pop()}`;
                            downloadMedia(submission.media_url!, filename);
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Submission Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">
                          {submission.guest_name || "Anonymous"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {submission.media_type === "photo"
                            ? "📷 Photo"
                            : "🎥 Video"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  No photos or videos yet
                </h4>
                <p className="text-muted-foreground">
                  Be the first to share a memory!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
