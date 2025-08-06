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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Please select a photo or video file");
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? "photo" : "video");

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      toast.error("Please write a message");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = null;

      // Upload media file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("guest-media")
          .upload(fileName, selectedFile);

        if (uploadError) {
          throw new Error("Failed to upload media file");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("guest-media").getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      // Create submission
      const { error: submissionError } = await supabase
        .from("guest_submissions")
        .insert({
          booth_id: booth.id,
          guest_name: formData.guest_name || null,
          message: formData.message,
          media_url: mediaUrl,
          media_type: selectedFile ? mediaType : null,
          is_approved: !booth.requires_approval, // Auto-approve if not required
        });

      if (submissionError) {
        throw new Error("Failed to submit message");
      }

      // Reset form
      setFormData({ guest_name: "", message: "" });
      removeFile();

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
                  {!selectedFile ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 border-dashed border-2 border-border hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload photo or video
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max 10MB
                        </p>
                      </div>
                    </Button>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                        {mediaType === "photo" ? (
                          <Image
                            src={previewUrl!}
                            alt="Preview"
                            width={400}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={previewUrl!}
                            controls
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
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
                  required
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
                      {submission.media_type === "photo" ? (
                        <Image
                          src={submission.media_url!}
                          alt={`Photo by ${submission.guest_name || "Anonymous"}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={submission.media_url!}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Download Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const filename = `${submission.guest_name || "anonymous"}-${submission.media_type}-${new Date(submission.created_at).toISOString().split("T")[0]}.${submission.media_url?.split(".").pop()}`;
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
