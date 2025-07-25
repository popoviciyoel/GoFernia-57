interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SendEmailOptions {
  to: string
  name: string
  template: "welcome" | "confirmation"
  data?: Record<string, any>
}

class EmailService {
  private provider: "resend" | "sendgrid" | "mailgun" | "nodemailer"
  private apiKey: string
  private fromEmail: string
  private fromName: string
  private mailgunDomain?: string

  constructor() {
    // Determine which email provider to use based on available env vars
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      this.provider = "mailgun"
      this.apiKey = process.env.MAILGUN_API_KEY
      this.mailgunDomain = process.env.MAILGUN_DOMAIN
    } else if (process.env.RESEND_API_KEY) {
      this.provider = "resend"
      this.apiKey = process.env.RESEND_API_KEY
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = "sendgrid"
      this.apiKey = process.env.SENDGRID_API_KEY
    } else {
      this.provider = "nodemailer"
      this.apiKey = process.env.SMTP_PASSWORD || ""
    }

    this.fromEmail = process.env.FROM_EMAIL || "yoel@gofernia.com"
    this.fromName = process.env.FROM_NAME || "GoFernia Team"

    console.log(`📧 Email service initialized with provider: ${this.provider}`)
  }

  private getEmailTemplate(template: "welcome" | "confirmation", data: Record<string, any>): EmailTemplate {
    const templates = {
      welcome: {
        subject: `Welcome to GoFernia, ${data.name}! 🎮`,
        html: this.getWelcomeEmailHTML(data),
        text: this.getWelcomeEmailText(data),
      },
      confirmation: {
        subject: `Thanks for signing up, ${data.name}! ✨`,
        html: this.getConfirmationEmailHTML(data),
        text: this.getConfirmationEmailText(data),
      },
    }

    return templates[template]
  }

  private getWelcomeEmailHTML(data: Record<string, any>): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GoFernia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1f2937; margin-top: 0; font-size: 24px; }
    .content p { color: #6b7280; margin-bottom: 20px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .features { background: #f9fafb; padding: 30px; margin: 30px 0; border-radius: 8px; }
    .feature { margin-bottom: 20px; }
    .feature h3 { color: #1f2937; margin: 0 0 8px; font-size: 18px; }
    .feature p { color: #6b7280; margin: 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Welcome to GoFernia!</h1>
      <p>Turn your traffic into fans with play-to-win experiences</p>
    </div>
    
    <div class="content">
      <h2>Hi ${data.name}! 👋</h2>
      
      <p>Welcome to the future of fashion e-commerce! We're thrilled you've joined our beta program.</p>
      
      <p>GoFernia helps fashion brands like yours transform boring shopping experiences into engaging, game-like adventures that customers love to share.</p>
      
      <div class="features">
        <div class="feature">
          <h3>🎯 Interactive Mini-Games</h3>
          <p>Spin-to-win wheels, scratch cards, trivia quizzes, and more to capture emails and boost engagement.</p>
        </div>
        
        <div class="feature">
          <h3>📈 Proven Results</h3>
          <p>Our early partners are seeing significant increases in email signups and purchase intent.</p>
        </div>
        
        <div class="feature">
          <h3>🚀 Easy Integration</h3>
          <p>Simple embed codes that work with any e-commerce platform - no technical expertise required.</p>
        </div>
      </div>
      
      <p><strong>What happens next?</strong></p>
      <p>Our team will reach out within 24-48 hours to:</p>
      <ul>
        <li>Schedule a personalized demo</li>
        <li>Discuss your specific needs and goals</li>
        <li>Set up your first gamified experience</li>
      </ul>
      
      ${data.comment ? `<p><strong>Your message:</strong> "${data.comment}"</p><p>Thanks for sharing this with us - we'll make sure to address this in our conversation!</p>` : ""}
      
      <a href="https://gofernia.com/dashboard" class="cta-button">Access Your Dashboard</a>
    </div>
    
    <div class="footer">
      <p>Questions? Reply to this email or reach out at <a href="mailto:hello@gofernia.com">hello@gofernia.com</a></p>
      <p>GoFernia - Making e-commerce more engaging, one game at a time</p>
      <p><a href="https://gofernia.com/unsubscribe">Unsubscribe</a> | <a href="https://gofernia.com/privacy">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getWelcomeEmailText(data: Record<string, any>): string {
    return `
Welcome to GoFernia, ${data.name}!

We're thrilled you've joined our beta program to transform fashion e-commerce with gamification.

What GoFernia offers:
• Interactive mini-games (spin-to-win, scratch cards, trivia)
• Proven increases in email signups and engagement
• Easy integration with any e-commerce platform

What happens next:
Our team will reach out within 24-48 hours to:
- Schedule a personalized demo
- Discuss your specific needs and goals  
- Set up your first gamified experience

${data.comment ? `Your message: "${data.comment}"\nThanks for sharing - we'll address this in our conversation!` : ""}

Questions? Reply to this email or contact hello@gofernia.com

GoFernia Team
Making e-commerce more engaging, one game at a time
    `
  }

  private getConfirmationEmailHTML(data: Record<string, any>): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks for signing up!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #10b981, #3b82f6); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px 30px; text-align: center; }
    .checkmark { width: 60px; height: 60px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ You're All Set!</h1>
    </div>
    
    <div class="content">
      <div class="checkmark">✓</div>
      <h2>Thanks for signing up, ${data.name}!</h2>
      <p>We've received your information and you're now part of the GoFernia beta program.</p>
      <p>Keep an eye on your inbox - we'll be in touch soon with your access details and next steps.</p>
      ${data.source ? `<p><small>Signed up from: ${data.source.replace("_", " ")}</small></p>` : ""}
    </div>
    
    <div class="footer">
      <p>GoFernia Team | <a href="mailto:yoel@gofernia.com">yoel@gofernia.com</a></p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getConfirmationEmailText(data: Record<string, any>): string {
    return `
Thanks for signing up, ${data.name}!

You're now part of the GoFernia beta program.

We've received your information and will be in touch soon with your access details and next steps.

${data.source ? `Signed up from: ${data.source.replace("_", " ")}` : ""}

GoFernia Team
yoel@gofernia.com
    `
  }

  async sendEmail({ to, name, template, data = {} }: SendEmailOptions): Promise<boolean> {
    try {
      const emailData = { name, ...data }
      const emailTemplate = this.getEmailTemplate(template, emailData)

      console.log(`📧 Sending ${template} email to ${to} via ${this.provider}`)

      switch (this.provider) {
        case "mailgun":
          return await this.sendWithMailgun(to, emailTemplate)
        case "resend":
          return await this.sendWithResend(to, emailTemplate)
        case "sendgrid":
          return await this.sendWithSendGrid(to, emailTemplate)
        case "nodemailer":
          return await this.sendWithNodemailer(to, emailTemplate)
        default:
          console.warn("No email provider configured, skipping email send")
          return false
      }
    } catch (error) {
      console.error("Email send error:", error)
      return false
    }
  }

  private async sendWithMailgun(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      if (!this.mailgunDomain) {
        console.error("Mailgun domain not configured")
        return false
      }

      // Mailgun uses basic auth with 'api' as username and API key as password
      const auth = Buffer.from(`api:${this.apiKey}`).toString("base64")

      // Create form data for Mailgun API
      const formData = new FormData()
      formData.append("from", `${this.fromName} <${this.fromEmail}>`)
      formData.append("to", to)
      formData.append("subject", template.subject)
      formData.append("html", template.html)
      formData.append("text", template.text)

      // Add tracking and other Mailgun features
      formData.append("o:tracking", "true")
      formData.append("o:tracking-clicks", "true")
      formData.append("o:tracking-opens", "true")

      const response = await fetch(`https://api.mailgun.net/v3/${this.mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Email sent via Mailgun:", result.id)
        return true
      } else {
        const error = await response.json()
        console.error("Mailgun error:", error)
        return false
      }
    } catch (error) {
      console.error("Mailgun send error:", error)
      return false
    }
  }

  private async sendWithResend(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Email sent via Resend:", result.id)
        return true
      } else {
        const error = await response.json()
        console.error("Resend error:", error)
        return false
      }
    } catch (error) {
      console.error("Resend send error:", error)
      return false
    }
  }

  private async sendWithSendGrid(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: this.fromEmail, name: this.fromName },
          subject: template.subject,
          content: [
            { type: "text/html", value: template.html },
            { type: "text/plain", value: template.text },
          ],
        }),
      })

      if (response.ok) {
        console.log("✅ Email sent via SendGrid")
        return true
      } else {
        const error = await response.text()
        console.error("SendGrid error:", error)
        return false
      }
    } catch (error) {
      console.error("SendGrid send error:", error)
      return false
    }
  }

  private async sendWithNodemailer(to: string, template: EmailTemplate): Promise<boolean> {
    // For Nodemailer, you'd typically use it server-side with SMTP
    // This is a placeholder - in a real app, you'd implement SMTP sending
    console.log("📧 Would send email via Nodemailer (SMTP):", {
      to,
      subject: template.subject,
      provider: "SMTP",
    })

    // Simulate successful send for demo
    return true
  }

  async sendWelcomeEmail(to: string, name: string, additionalData: Record<string, any> = {}): Promise<boolean> {
    return this.sendEmail({
      to,
      name,
      template: "welcome",
      data: additionalData,
    })
  }

  async sendConfirmationEmail(to: string, name: string, additionalData: Record<string, any> = {}): Promise<boolean> {
    return this.sendEmail({
      to,
      name,
      template: "confirmation",
      data: additionalData,
    })
  }

  // Mailgun-specific features
  async sendWithMailgunTemplate(to: string, templateName: string, templateData: Record<string, any>): Promise<boolean> {
    if (this.provider !== "mailgun" || !this.mailgunDomain) {
      console.warn("Mailgun templates only available when using Mailgun provider")
      return false
    }

    try {
      const auth = Buffer.from(`api:${this.apiKey}`).toString("base64")
      const formData = new FormData()

      formData.append("from", `${this.fromName} <${this.fromEmail}>`)
      formData.append("to", to)
      formData.append("template", templateName)
      formData.append("h:X-Mailgun-Variables", JSON.stringify(templateData))

      const response = await fetch(`https://api.mailgun.net/v3/${this.mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Mailgun template email sent:", result.id)
        return true
      } else {
        const error = await response.json()
        console.error("Mailgun template error:", error)
        return false
      }
    } catch (error) {
      console.error("Mailgun template send error:", error)
      return false
    }
  }

  // Get email provider info
  getProviderInfo() {
    return {
      provider: this.provider,
      domain: this.mailgunDomain,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    }
  }
}

export const emailService = new EmailService()
