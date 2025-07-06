"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Activity, Mail, Users, RefreshCw, Trash2 } from "lucide-react"

export default function DatabaseAdminPage() {
  const [dbStats, setDbStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [connectionStatus, setConnectionStatus] = useState<any>(null)

  const testConnection = async () => {
    try {
      const response = await fetch("/api/database-test")
      const result = await response.json()
      setConnectionStatus(result)
    } catch (error) {
      setConnectionStatus({ success: false, error: "Failed to test connection" })
    }
  }

  useEffect(() => {
    testConnection()
    loadDatabaseStats()
  }, [])

  const loadDatabaseStats = async () => {
    setIsLoading(true)
    try {
      // Load analytics stats
      const analyticsResponse = await fetch("/api/analytics")
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : null

      // Load signup stats
      const signupsResponse = await fetch("/api/signup")
      const signupsData = signupsResponse.ok ? await signupsResponse.json() : null

      setDbStats({
        analytics: analyticsData?.stats,
        signups: signupsData?.stats,
        connected: analyticsResponse.ok && signupsResponse.ok,
      })
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to load database stats:", error)
      setDbStats({ connected: false, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm("Are you sure you want to delete ALL data from the database? This cannot be undone.")) {
      return
    }

    try {
      await fetch("/api/analytics", { method: "DELETE" })
      await fetch("/api/signup", { method: "DELETE" })
      await loadDatabaseStats()
      console.log("All database data cleared")
    } catch (error) {
      console.error("Failed to clear database:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Database Administration</h1>
          <p className="text-gray-600">Monitor and manage your Neon PostgreSQL database</p>

          {/* Connection Test */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={connectionStatus?.success ? "default" : "destructive"}>
                    {connectionStatus?.success ? "Connected" : "Failed"}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {connectionStatus?.message || connectionStatus?.error || "Testing connection..."}
                  </span>
                  <Button size="sm" variant="outline" onClick={testConnection}>
                    Test Again
                  </Button>
                </div>

                {connectionStatus?.suggestions && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">💡 Suggestions:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {connectionStatus.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-4 items-center">
            <Button onClick={loadDatabaseStats} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Stats
            </Button>
            <Button variant="outline" onClick={clearAllData}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
            <div className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={dbStats?.connected ? "default" : "destructive"}>
                {dbStats?.connected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-gray-600">
                {dbStats?.connected
                  ? "Neon PostgreSQL database is connected and operational"
                  : "Database connection failed"}
              </span>
            </div>
            {dbStats?.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                Error: {dbStats.error}
              </div>
            )}
          </CardContent>
        </Card>

        {dbStats?.connected && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="signups" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Signups
              </TabsTrigger>
              <TabsTrigger value="emails" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Emails
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{dbStats?.analytics?.totalEvents || 0}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {dbStats?.analytics?.uniqueSessions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Unique Sessions</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{dbStats?.signups?.totalSignups || 0}</div>
                    <div className="text-sm text-gray-600">Total Signups</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {dbStats?.signups?.emailSuccessRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Email Success Rate</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">📊 analytics_events</h3>
                      <p className="text-sm text-gray-600 mb-2">Stores all user interaction events</p>
                      <div className="text-2xl font-bold text-blue-600">
                        {dbStats?.analytics?.totalEvents || 0} records
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">👥 analytics_sessions</h3>
                      <p className="text-sm text-gray-600 mb-2">Tracks user sessions and metadata</p>
                      <div className="text-2xl font-bold text-green-600">
                        {dbStats?.analytics?.uniqueSessions || 0} records
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">📝 signups</h3>
                      <p className="text-sm text-gray-600 mb-2">User registration data</p>
                      <div className="text-2xl font-bold text-purple-600">
                        {dbStats?.signups?.totalSignups || 0} records
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">📧 email_logs</h3>
                      <p className="text-sm text-gray-600 mb-2">Email delivery tracking</p>
                      <div className="text-2xl font-bold text-orange-600">
                        {dbStats?.signups?.emailsSent || 0} records
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{dbStats?.analytics?.pageViews || 0}</div>
                      <div className="text-sm text-gray-600">Page Views</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{dbStats?.analytics?.gameEvents || 0}</div>
                      <div className="text-sm text-gray-600">Game Events</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{dbStats?.analytics?.ctaClicks || 0}</div>
                      <div className="text-sm text-gray-600">CTA Clicks</div>
                    </CardContent>
                  </Card>
                </div>

                {dbStats?.analytics?.eventTypes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Event Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(dbStats.analytics.eventTypes)
                          .slice(0, 10)
                          .map(([event, count]) => (
                            <div key={event} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{event}</span>
                              <Badge variant="outline">{count as number}</Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="signups">
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{dbStats?.signups?.todaySignups || 0}</div>
                      <div className="text-sm text-gray-600">Today's Signups</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{dbStats?.signups?.phoneProvided || 0}</div>
                      <div className="text-sm text-gray-600">With Phone</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {dbStats?.signups?.commentsProvided || 0}
                      </div>
                      <div className="text-sm text-gray-600">With Comments</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{dbStats?.signups?.emailsSent || 0}</div>
                      <div className="text-sm text-gray-600">Emails Sent</div>
                    </CardContent>
                  </Card>
                </div>

                {dbStats?.signups?.sourcesBreakdown && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Signup Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(dbStats.signups.sourcesBreakdown).map(([source, count]) => (
                          <Badge key={source} variant="outline" className="text-sm">
                            {source.replace("_", " ")}: {count as number}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="emails">
              <Card>
                <CardHeader>
                  <CardTitle>Email Delivery Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{dbStats?.signups?.emailsSent || 0}</div>
                      <div className="text-sm text-gray-600">Emails Sent</div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{dbStats?.signups?.emailSuccessRate || 0}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(dbStats?.signups?.totalSignups || 0) - (dbStats?.signups?.emailsSent || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Failed/Pending</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">📧 Email Tracking</h4>
                    <p className="text-sm text-yellow-700">
                      All email attempts are logged in the database with delivery status, provider information, and
                      error messages for debugging.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
