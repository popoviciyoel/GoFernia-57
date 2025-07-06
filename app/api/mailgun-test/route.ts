import { type NextRequest, NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, template = "welcome", useTemplate = false, templateName } = body

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Email and name are required" }, { status: 400 })
    }

    const providerInfo = emailService.getProviderInfo()

    if (providerInfo.provider !== "mailgun") {
      return NextResponse.json({ success: false, error: "Mailgun is not the active email provider" }, { status: 400 })
    }

    console.log(`🧪 Testing Mailgun email to ${email}`)

    let emailSent = false

    if (useTemplate && templateName) {
      // Use Mailgun template
      emailSent = await emailService.sendWithMailgunTemplate(email, templateName, {
        name,
        company: "GoFernia",
        signup_date: new Date().toLocaleDateString(),
      })
    } else {
      // Use regular email templates
      if (template === "welcome") {
        emailSent = await emailService.sendWelcomeEmail(email, name, {
          source: "mailgun_test",
          comment: "This is a Mailgun test email",
        })
      } else if (template === "confirmation") {
        emailSent = await emailService.sendConfirmationEmail(email, name, {
          source: "mailgun_test",
        })
      }
    }

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? `Mailgun test email sent successfully!` : `Failed to send Mailgun test email`,
      email,
      template: useTemplate ? templateName : template,
      provider: providerInfo,
    })
  } catch (error) {
    console.error("Mailgun test API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const providerInfo = emailService.getProviderInfo()

    return NextResponse.json({
      success: true,
      provider: providerInfo,
      mailgunFeatures: {
        tracking: "Email opens and clicks tracked automatically",
        templates: "Support for Mailgun templates",
        analytics: "Built-in email analytics",
        deliverability: "High deliverability rates",
        webhooks: "Real-time event webhooks available",
      },
    })
  } catch (error) {
    console.error("Mailgun info API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
