"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useCreateBooth } from "@/queries/booth";
import { Heart, Calendar, Mail, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function CreateBoothPage() {
  const createBooth = useCreateBooth();
  const [formData, setFormData] = useState({
    couple_name: "",
    wedding_date: "",
    email: "",
    is_public: false,
    requires_approval: true,
    email_notifications: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBooth.mutate(formData);
  };

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">
            Create Your Booth
          </h1>
        </header>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg border border-border p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Welcome to Love Lens
                </h2>
                <p className="text-muted-foreground">
                  Set up your digital guestbook and start collecting memories
                  from your special day
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Couple Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Couple Information
                  </h3>

                  <div>
                    <Label htmlFor="couple_name">Couple Name</Label>
                    <Input
                      id="couple_name"
                      value={formData.couple_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          couple_name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Emily & David"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="wedding_date">Wedding Date</Label>
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
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
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
                      placeholder="your@email.com"
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We&apos;ll send you notifications when guests submit
                      photos and messages
                    </p>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Privacy Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          Public Booth
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow guests to view all approved submissions
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_public: checked,
                          }))
                        }
                      />
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
                      <Switch
                        checked={formData.requires_approval}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            requires_approval: checked,
                          }))
                        }
                      />
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
                      <Switch
                        checked={formData.email_notifications}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            email_notifications: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3"
                    disabled={createBooth.isPending}
                  >
                    {createBooth.isPending
                      ? "Creating Booth..."
                      : "Create Booth"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
