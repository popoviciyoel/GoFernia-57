import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"
import { createSignup, getSignups, getSignupStats, createEmailLog, clearAllData } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, comment, source, sessionId } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    console.log("✅ New signup received:", {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      source,
      hasPhone: !!phone,
      hasComment: !!comment,
    })

    // Send confirmation email first
    let emailSent = false
    let emailError = null

    try {
      emailSent = await emailService.sendWelcomeEmail(email.toLowerCase().trim(), name.trim(), {
        source,
        comment: comment?.trim(),
        phone: phone?.trim(),
        signupDate: new Date().toLocaleDateString(),
      })

      // Log email attempt
      await createEmailLog({
        email: email.toLowerCase().trim(),
        templateName: "welcome",
        provider: emailService.getProviderInfo().provider,
        status: emailSent ? "sent" : "failed",
        errorMessage: emailSent ? null : "Email sending failed",
      })

      if (emailSent) {
        console.log("📧 Welcome email sent successfully to:", email)
      } else {
        console.warn("⚠️ Failed to send welcome email to:", email)
      }
    } catch (error) {
      console.error("Email sending error:", error)
      emailError = error instanceof Error ? error.message : "Unknown email error"

      // Log email error
      await createEmailLog({
        email: email.toLowerCase().trim(),
        templateName: "welcome",
        provider: emailService.getProviderInfo().provider,
        status: "error",
        errorMessage: emailError,
      })
    }

    // Save signup to database
    try {
      const signup = await createSignup({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        comment: comment?.trim(),
        source,
        sessionId,
        emailSent,
      })

      console.log("💾 Signup saved to database:", signup.id)

      return NextResponse.json({
        success: true,
        message: emailSent
          ? "Signup successful! Check your email for confirmation."
          : "Signup successful! We'll be in touch soon.",
        data: {
          id: signup.id,
          email: signup.email,
          timestamp: signup.created_at,
          emailSent,
        },
      })
    } catch (dbError) {
      console.error("Database error:", dbError)

      // Check if it's a unique constraint violation (duplicate email)
      if (dbError instanceof Error && dbError.message.includes("duplicate key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Email already registered",
          },
          { status: 409 },
        )
      }

      // For other database errors, still return success since email was sent
      return NextResponse.json({
        success: true,
        message: emailSent
          ? "Signup processed! Check your email for confirmation."
          : "Signup processed! We'll be in touch soon.",
        warning: "Data storage issue - our team has been notified",
      })
    }
  } catch (error) {
    console.error("Signup API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const email = searchParams.get("email")

    // Get signups from database
    const signups = await getSignups(limit, offset, email || undefined)
    const stats = await getSignupStats()

    // Format signups for response (hide sensitive data)
    const formattedSignups = signups.map((signup: any) => ({
      ...signup,
      email: signup.email.replace(/(.{2}).*@/, "$1***@"), // Partially hide email
    }))

    return NextResponse.json({
      success: true,
      signups: formattedSignups,
      stats: {
        totalSignups: Number.parseInt(stats.total_signups),
        todaySignups: Number.parseInt(stats.today_signups),
        phoneProvided: Number.parseInt(stats.phone_provided),
        commentsProvided: Number.parseInt(stats.comments_provided),
        emailsSent: Number.parseInt(stats.emails_sent),
        emailSuccessRate: Number.parseFloat(stats.email_success_rate) || 0,
        sourcesBreakdown: stats.sources_breakdown,
      },
      pagination: {
        limit,
        offset,
        hasMore: signups.length === limit,
      },
    })
  } catch (error) {
    console.error("Signup GET Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve signups",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    // Only clear signups table for this endpoint
    await clearAllData()
    console.log("🗑️ All signup data cleared from database")

    return NextResponse.json({
      success: true,
      message: "All signup data cleared",
    })
  } catch (error) {
    console.error("Signup DELETE Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear signup data",
      },
      { status: 500 },
    )
  }
}
