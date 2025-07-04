import { type NextRequest, NextResponse } from "next/server"

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

// In a real application, you'd use a proper database
// For demo purposes, we'll use in-memory storage
let analyticsData: AnalyticsEvent[] = []
let sessions: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events, sessionData } = body

    // Store events
    if (events && Array.isArray(events)) {
      analyticsData.push(...events)
      console.log(`📊 Server: Stored ${events.length} analytics events`)
    }

    // Store session data
    if (sessionData) {
      sessions[sessionData.sessionId] = sessionData
      console.log(`👤 Server: Updated session ${sessionData.sessionId}`)
    }

    // In a real app, you'd save to database here
    // await saveToDatabase(events, sessionData)

    return NextResponse.json({
      success: true,
      message: `Stored ${events?.length || 0} events`,
      totalEvents: analyticsData.length,
    })
  } catch (error) {
    console.error("Analytics API Error:", error)
    return NextResponse.json({ success: false, error: "Failed to store analytics data" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let filteredEvents = analyticsData
    if (sessionId) {
      filteredEvents = analyticsData.filter((event) => event.sessionId === sessionId)
    }

    // Get recent events
    const recentEvents = filteredEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit)

    // Calculate basic stats
    const stats = {
      totalEvents: filteredEvents.length,
      uniqueSessions: new Set(filteredEvents.map((e) => e.sessionId)).size,
      eventTypes: filteredEvents.reduce((acc: Record<string, number>, event) => {
        acc[event.event] = (acc[event.event] || 0) + 1
        return acc
      }, {}),
      timeRange: {
        earliest: Math.min(...filteredEvents.map((e) => e.timestamp)),
        latest: Math.max(...filteredEvents.map((e) => e.timestamp)),
      },
    }

    return NextResponse.json({
      success: true,
      events: recentEvents,
      stats,
      sessions: sessionId ? sessions[sessionId] : Object.keys(sessions).length,
    })
  } catch (error) {
    console.error("Analytics GET Error:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve analytics data" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    analyticsData = []
    sessions = {}
    console.log("🗑️ Server: Analytics data cleared")

    return NextResponse.json({
      success: true,
      message: "Analytics data cleared",
    })
  } catch (error) {
    console.error("Analytics DELETE Error:", error)
    return NextResponse.json({ success: false, error: "Failed to clear analytics data" }, { status: 500 })
  }
}
