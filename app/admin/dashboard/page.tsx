import { AppSidebar } from "@/components/app-sidebar";

export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <header className="flex h-16 items-center gap-2 border-b px-6">
          <h1 className="text-xl font-semibold text-foreground">
            Admin Dashboard
          </h1>
        </header>

        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="grid gap-6">
            {/* Welcome section */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Admin Panel
              </h2>
              <p className="text-muted-foreground">
                Manage your Love Lens application settings and content.
              </p>
            </div>

            {/* Admin stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Total Users
                </h3>
                <p className="text-2xl font-bold text-foreground">1,234</p>
              </div>
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Active Sessions
                </h3>
                <p className="text-2xl font-bold text-foreground">89</p>
              </div>
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Storage Used
                </h3>
                <p className="text-2xl font-bold text-foreground">2.4 GB</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">+</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Add New User</p>
                    <p className="text-sm text-muted-foreground">
                      Create a new user account
                    </p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">📊</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      View Analytics
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check usage statistics
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
