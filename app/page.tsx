import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-12 h-12 text-primary-foreground" />
          </div>

          <h2 className="text-4xl font-serif text-foreground mb-6">
            Capture Your Wedding Memories
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create a digital guestbook where your loved ones can share photos,
            videos, and heartfelt messages from your special day.
          </p>

          <div className="flex items-center justify-center gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Photo & Video Uploads
              </h3>
              <p className="text-sm text-muted-foreground">
                Guests can share memories
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💌</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Digital Guestbook
              </h3>
              <p className="text-sm text-muted-foreground">
                Collect messages & well wishes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                Privacy Control
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage who sees what
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Your Booth
              </Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Made with ❤️ for couples celebrating their love
          </p>
        </div>
      </footer>
    </div>
  );
}
