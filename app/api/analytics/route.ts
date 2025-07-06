import { type NextRequest, NextResponse } from "next/server"
import {
  createAnalyticsEvent,
  getAnalyticsEvents,
  getAnalyticsStats,
  upsertAnalyticsSession,
  clearAllData,
  testDatabaseConnection,
  fallbackStorage,
} from "@/lib/database"

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events, sessionData } = body

    // Test database connection first
    const isDatabaseConnected = await testDatabaseConnection()

    if (!isDatabaseConnected) {
      console.warn("⚠️ Database not available, using fallback storage")

      // Use fallback storage
      if (events && Array.isArray(events)) {
        for (const event of events) {
          await fallbackStorage.createEvent({
            event_name: event.event,
            session_id: event.sessionId,
            properties: event.properties || {},
            created_at: new Date(),
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Stored ${events?.length || 0} events (fallback mode)`,
        eventsStored: events?.length || 0,
        sessionUpdated: false,
        fallbackMode: true,
      })
    }

    // Get client IP address
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    let eventsStored = 0
    let sessionUpdated = false

    // Store events in database
    if (events && Array.isArray(events)) {
      for (const event of events) {
        try {
          await createAnalyticsEvent({
            eventName: event.event,
            sessionId: event.sessionId,
            userId: event.userId,
            properties: event.properties || {},
            pageUrl: event.properties?.page_url,
            pageTitle: event.properties?.page_title,
            userAgent: event.properties?.user_agent,
            ipAddress: ip,
            referrer: event.properties?.referrer,
            utmSource: event.properties?.utm_source,
            utmMedium: event.properties?.utm_medium,
            utmCampaign: event.properties?.utm_campaign,
          })
          eventsStored++
        } catch (eventError) {
          console.error("Error storing individual event:", eventError)
          // Continue processing other events
        }
      }
      console.log(`📊 Database: Stored ${eventsStored}/${events.length} analytics events`)
    }

    // Store/update session data in database
    if (sessionData) {
      try {
        // Parse user agent for device info (basic parsing)
        const userAgent = sessionData.userAgent || ""
        const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? "mobile" : "desktop"
        const browser = userAgent.includes("Chrome")
          ? "Chrome"
          : userAgent.includes("Firefox")
            ? "Firefox"
            : userAgent.includes("Safari")
              ? "Safari"
              : "Unknown"
        const os = userAgent.includes("Windows")
          ? "Windows"
          : userAgent.includes("Mac")
            ? "macOS"
            : userAgent.includes("Linux")
              ? "Linux"
              : userAgent.includes("Android")
                ? "Android"
                : userAgent.includes("iOS")
                  ? "iOS"
                  : "Unknown"

        await upsertAnalyticsSession({
          sessionId: sessionData.sessionId,
          userId: sessionData.userId,
          startTime: new Date(sessionData.startTime),
          lastActivity: new Date(sessionData.lastActivity),
          pageViews: sessionData.pageViews || 0,
          eventsCount: sessionData.events?.length || 0,
          userAgent: sessionData.userAgent,
          referrer: sessionData.referrer,
          utmSource: sessionData.utmSource,
          utmMedium: sessionData.utmMedium,
          utmCampaign: sessionData.utmCampaign,
          ipAddress: ip,
          deviceType,
          browser,
          os,
        })
        sessionUpdated = true
        console.log(`👤 Database: Updated session ${sessionData.sessionId}`)
      } catch (sessionError) {
        console.error("Error storing session data:", sessionError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Stored ${eventsStored} events`,
      eventsStored,
      sessionUpdated,
      fallbackMode: false,
    })
  } catch (error) {
    console.error("Analytics API Error:", error)

    // Provide helpful error messages
    let errorMessage = "Failed to store analytics data"
    if (error instanceof Error) {
      if (error.message.includes("authentication failed")) {
        errorMessage = "Database authentication failed - check DATABASE_URL"
      } else if (error.message.includes("connection")) {
        errorMessage = "Database connection failed"
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    // Test database connection
    const isDatabaseConnected = await testDatabaseConnection()

    if (!isDatabaseConnected) {
      console.warn("⚠️ Database not available, using fallback storage")

      const events = await fallbackStorage.getEvents()
      const stats = await fallbackStorage.getStats()

      return NextResponse.json({
        success: true,
        events: events.slice(0, limit),
        stats,
        fallbackMode: true,
      })
    }

    // Get events from database
    const events = await getAnalyticsEvents(limit, sessionId || undefined)
    const stats = await getAnalyticsStats()

    return NextResponse.json({
      success: true,
      events: events.map((event: any) => ({
        event: event.event_name,
        properties: event.properties,
        timestamp: new Date(event.created_at).getTime(),
        sessionId: event.session_id,
        userId: event.user_id,
      })),
      stats: {
        totalEvents: Number.parseInt(stats.total_events),
        uniqueSessions: Number.parseInt(stats.unique_sessions),
        todayEvents: Number.parseInt(stats.today_events),
        pageViews: Number.parseInt(stats.page_views),
        gameEvents: Number.parseInt(stats.game_events),
        emailCaptures: Number.parseInt(stats.email_captures),
        ctaClicks: Number.parseInt(stats.cta_clicks),
        eventTypes: stats.event_types,
        topSources: stats.top_sources,
      },
      fallbackMode: false,
    })
  } catch (error) {
    console.error("Analytics GET Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const isDatabaseConnected = await testDatabaseConnection()

    if (!isDatabaseConnected) {
      fallbackStorage.clear()
      return NextResponse.json({
        success: true,
        message: "Fallback storage cleared",
        fallbackMode: true,
      })
    }

    await clearAllData()
    console.log("🗑️ Database: All analytics data cleared")

    return NextResponse.json({
      success: true,
      message: "Analytics data cleared",
      fallbackMode: false,
    })
  } catch (error) {
    console.error("Analytics DELETE Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
