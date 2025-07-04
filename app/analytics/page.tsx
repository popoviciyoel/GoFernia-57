"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { analytics } from "@/lib/analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

export default function AnalyticsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [sessionData, setSessionData] = useState<any>(null)
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = () => {
    const allEvents = analytics.getAllEvents()
    const session = analytics.getSessionData()

    setEvents(allEvents)
    setSessionData(session)

    // Calculate stats
    const gameEvents = allEvents.filter((e: any) => e.event.includes("game"))
    const emailCaptures = allEvents.filter((e: any) => e.event === "email_capture")
    const ctaClicks = allEvents.filter((e: any) => e.event === "cta_click")
    const pageViews = allEvents.filter((e: any) => e.event === "page_view")

    setStats({
      totalEvents: allEvents.length,
      gameInteractions: gameEvents.length,
      emailCaptures: emailCaptures.length,
      ctaClicks: ctaClicks.length,
      pageViews: pageViews.length,
      conversionRate: pageViews.length > 0 ? ((emailCaptures.length / pageViews.length) * 100).toFixed(2) : 0,
    })
  }

  const clearData = () => {
    analytics.clearData()
    loadAnalyticsData()
  }

  // Process data for charts
  const gameTypeData = events
    .filter((e) => e.event === "game_start")
    .reduce((acc: any, event) => {
      const gameType = event.properties.game_type || "unknown"
      acc[gameType] = (acc[gameType] || 0) + 1
      return acc
    }, {})

  const gameChartData = Object.entries(gameTypeData).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value,
  }))

  const ctaClickData = events
    .filter((e) => e.event === "cta_click")
    .reduce((acc: any, event) => {
      const location = event.properties.cta_location || "unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {})

  const ctaChartData = Object.entries(ctaClickData).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value,
  }))

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights into user behavior and game performance</p>
          <div className="mt-4 flex gap-4">
            <Button onClick={loadAnalyticsData}>Refresh Data</Button>
            <Button variant="outline" onClick={clearData}>
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEvents}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.pageViews}</div>
              <div className="text-sm text-gray-600">Page Views</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.gameInteractions}</div>
              <div className="text-sm text-gray-600">Game Interactions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.emailCaptures}</div>
              <div className="text-sm text-gray-600">Email Captures</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.ctaClicks}</div>
              <div className="text-sm text-gray-600">CTA Clicks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Game Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gameChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {gameChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ctaChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Session Info */}
        {sessionData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Session ID</div>
                  <div className="font-mono text-sm">{sessionData.sessionId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Page Views</div>
                  <div className="font-semibold">{sessionData.pageViews}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Events</div>
                  <div className="font-semibold">{sessionData.events.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-semibold">
                    {Math.round((sessionData.lastActivity - sessionData.startTime) / 1000)}s
                  </div>
                </div>
              </div>
              {sessionData.utmSource && (
                <div className="mt-4 flex gap-2">
                  <Badge>UTM Source: {sessionData.utmSource}</Badge>
                  {sessionData.utmMedium && <Badge>UTM Medium: {sessionData.utmMedium}</Badge>}
                  {sessionData.utmCampaign && <Badge>UTM Campaign: {sessionData.utmCampaign}</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events
                .slice(-20)
                .reverse()
                .map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{event.event}</Badge>
                      <span className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.properties.page_url && <span>{new URL(event.properties.page_url).pathname}</span>}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
