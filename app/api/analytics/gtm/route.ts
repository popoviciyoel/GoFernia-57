import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, properties } = body

    // Here you could forward events to other analytics services
    // like Google Analytics 4, Facebook Pixel, etc.

    console.log("🏷️ GTM Event:", event, properties)

    // In a real application, you might:
    // 1. Validate the event data
    // 2. Transform it for different platforms
    // 3. Send to multiple analytics services
    // 4. Store in your data warehouse

    return NextResponse.json({
      success: true,
      message: "GTM event processed",
      event,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("GTM API Error:", error)
    return NextResponse.json({ success: false, error: "Failed to process GTM event" }, { status: 500 })
  }
}
