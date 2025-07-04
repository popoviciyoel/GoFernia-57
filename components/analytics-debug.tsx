"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalytics } from "@/lib/analytics"

export function AnalyticsDebug() {
  const [events, setEvents] = useState<any[]>([])
  const [serverData, setServerData] = useState<any>({ events: [], stats: {} })
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const analytics = useAnalytics()

  useEffect(() => {
    if (isVisible) {
      loadAnalyticsData()
      // Refresh data every 5 seconds when visible
      const interval = setInterval(loadAnalyticsData, 5000)
      return () => clearInterval(interval)
    }
  }, [isVisible, analytics])

  const loadAnalyticsData = async () => {
    // Load local events
    const localEvents = analytics.getAllEvents()
    setEvents(localEvents.slice(-10)) // Show last 10 events

    // Load server events
    try {
      const serverEvents = await analytics.getServerEvents()
      setServerData(serverEvents)
    } catch (error) {
      console.warn("Failed to load server events:", error)
    }
  }

  const triggerTestEvent = () => {
    analytics.track("debug_test", {
      test_data: "This is a test event",
      timestamp: new Date().toISOString(),
    })
  }

  const clearAllData = async () => {
    setIsLoading(true)
    await analytics.clearData()
    setEvents([])
    setServerData({ events: [], stats: {} })
    setIsLoading(false)
  }

  const testGTMEvent = () => {
    analytics.track("gtm_test", {
      test_type: "manual_trigger",
      value: Math.random(),
    })
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-20 right-6 z-50">
        <Button onClick={() => setIsVisible(true)} variant="outline" size="sm" className="bg-white shadow-lg">
          📊 Analytics Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[500px] max-h-[600px] overflow-hidden">
      <Card className="shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Analytics Debug Panel</CardTitle>
            <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={triggerTestEvent} size="sm" variant="outline">
              Test Event
            </Button>
            <Button onClick={testGTMEvent} size="sm" variant="outline">
              Test GTM
            </Button>
            <Button onClick={clearAllData} size="sm" variant="outline" disabled={isLoading}>
              {isLoading ? "Clearing..." : "Clear All"}
            </Button>
            <Button onClick={loadAnalyticsData} size="sm" variant="outline">
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="server">Server</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="space-y-2">
              <div className="text-xs text-gray-600">Local Events: {events.length}</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {events.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No local events yet. Interact with the page to see analytics events.
                  </div>
                ) : (
                  events
                    .slice()
                    .reverse()
                    .map((event, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {event.event}
                          </Badge>
                          <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {event.properties?.page_url && (
                          <div className="text-gray-600 mt-1 truncate">
                            {new URL(event.properties.page_url).pathname}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="server" className="space-y-2">
              <div className="text-xs text-gray-600">Server Events: {serverData.events?.length || 0}</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {!serverData.events || serverData.events.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No server events yet. Events are sent to server every 30 seconds.
                  </div>
                ) : (
                  serverData.events.slice(0, 10).map((event: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs bg-blue-100">
                          {event.event}
                        </Badge>
                        <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-gray-600 mt-1 text-xs">Session: {event.sessionId?.slice(-8)}</div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">Total Events</div>
                  <div className="text-lg">{serverData.stats?.totalEvents || 0}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold">Sessions</div>
                  <div className="text-lg">{serverData.stats?.uniqueSessions || 0}</div>
                </div>
              </div>

              {serverData.stats?.eventTypes && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold">Event Types:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {Object.entries(serverData.stats.eventTypes).map(([event, count]) => (
                      <div key={event} className="flex justify-between text-xs p-1 bg-gray-50 rounded">
                        <span>{event}</span>
                        <span className="font-semibold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                🏷️ GTM: {typeof window !== "undefined" && window.dataLayer ? "Loaded" : "Not loaded"}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
