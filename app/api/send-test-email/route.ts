import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, template = "welcome" } = body

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Email and name are required" }, { status: 400 })
    }

    console.log(`🧪 Sending test ${template} email to ${email}`)

    let emailSent = false

    if (template === "welcome") {
      emailSent = await emailService.sendWelcomeEmail(email, name, {
        source: "test",
        comment: "This is a test email",
      })
    } else if (template === "confirmation") {
      emailSent = await emailService.sendConfirmationEmail(email, name, {
        source: "test",
      })
    }

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? `Test ${template} email sent successfully!` : `Failed to send test ${template} email`,
      email,
      template,
    })
  } catch (error) {
    console.error("Test email API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
