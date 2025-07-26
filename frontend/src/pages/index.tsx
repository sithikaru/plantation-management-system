import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, BarChart3, Users, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-green-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-100">
                Plantation Management Dashboard
              </h1>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-green-800 dark:text-green-100 mb-2">
            Welcome to Your Plantation
          </h2>
          <p className="text-green-600 dark:text-green-300">
            Manage your agricultural operations with modern digital tools
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Crop Management Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Crop Management
              </CardTitle>
              <CardDescription>
                Monitor and manage your crops from planting to harvest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                View Crops
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>
                Track productivity and analyze farm performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Team Management Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage your farm workers and assign tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-green-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Crops</div>
          </div>
          <div className="bg-white dark:bg-green-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">85%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Health Score</div>
          </div>
          <div className="bg-white dark:bg-green-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">24</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Team Members</div>
          </div>
          <div className="bg-white dark:bg-green-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">$12.5k</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Monthly Revenue</div>
          </div>
        </div>
      </main>
    </div>
  );
}
