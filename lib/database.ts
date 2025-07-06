import { neon } from "@neondatabase/serverless"

// Validate and parse DATABASE_URL
function validateAndParseDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  // Check if URL has basic PostgreSQL format
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string")
  }

  // Log the parsed URL for debugging (without password)
  try {
    const urlObj = new URL(url)
    console.log("🔍 Database URL parsed:", {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      username: urlObj.username,
      searchParams: urlObj.searchParams.toString(),
    })
  } catch (parseError) {
    console.error("❌ Failed to parse DATABASE_URL:", parseError)
    throw new Error("DATABASE_URL format is invalid")
  }

  return url
}

// Initialize connection with validation
let sql: ReturnType<typeof neon>
let isSchemaInitialized = false

try {
  const databaseUrl = validateAndParseDatabaseUrl(process.env.DATABASE_URL)
  sql = neon(databaseUrl)
  console.log("🗄️ Database connection initialized")
} catch (error) {
  console.error("❌ Database connection failed:", error)
  // Create a mock function that throws errors for development
  sql = (() => {
    throw new Error(`Database not configured: ${error instanceof Error ? error.message : "Unknown error"}`)
  }) as any
}

export { sql }

// Test database connection with detailed error reporting
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing database connection...")

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable not found")
      return false
    }

    // Log connection attempt (without sensitive data)
    const urlObj = new URL(process.env.DATABASE_URL)
    console.log("🔗 Attempting connection to:", {
      host: urlObj.hostname,
      database: urlObj.pathname.slice(1),
      user: urlObj.username,
      ssl: urlObj.searchParams.get("sslmode"),
    })

    const result = await sql`SELECT 1 as test, current_user, current_database()`
    console.log("✅ Database connection test successful:", {
      test: result[0].test,
      user: result[0].current_user,
      database: result[0].current_database,
    })
    return true
  } catch (error) {
    console.error("❌ Database connection test failed:", error)

    // Provide specific error guidance
    if (error instanceof Error) {
      if (error.message.includes("password authentication failed")) {
        console.error("🔐 Authentication failed - check username and password in DATABASE_URL")
      } else if (error.message.includes("does not exist")) {
        console.error("🗄️ Database or user does not exist")
      } else if (error.message.includes("connection")) {
        console.error("🌐 Network connection failed - check host and port")
      }
    }

    return false
  }
}

// Check if schema exists
export async function checkSchemaExists(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'signups'
      ) as schema_exists
    `
    const exists = result[0].schema_exists
    console.log(`🔍 Schema exists: ${exists}`)
    return exists
  } catch (error) {
    console.error("Error checking schema:", error)
    return false
  }
}

// Auto-initialize schema if needed
export async function ensureSchemaExists(): Promise<boolean> {
  try {
    if (isSchemaInitialized) {
      return true
    }

    const schemaExists = await checkSchemaExists()
    if (!schemaExists) {
      console.log("🚀 Schema not found, initializing...")
      await initializeDatabase()
      isSchemaInitialized = true
      return true
    }

    isSchemaInitialized = true
    console.log("✅ Schema already exists")
    return true
  } catch (error) {
    console.error("❌ Failed to ensure schema exists:", error)
    return false
  }
}

// Database initialization and schema creation
export async function initializeDatabase() {
  try {
    console.log("🗄️ Initializing database schema...")

    // Test connection first
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      throw new Error("Cannot initialize database - connection failed")
    }

    // Create signups table
    await sql`
      CREATE TABLE IF NOT EXISTS signups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        comment TEXT,
        source VARCHAR(100) NOT NULL,
        session_id VARCHAR(255),
        email_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create analytics_events table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_name VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        properties JSONB DEFAULT '{}',
        page_url TEXT,
        page_title VARCHAR(500),
        user_agent TEXT,
        ip_address INET,
        referrer TEXT,
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create analytics_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id VARCHAR(255),
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
        page_views INTEGER DEFAULT 0,
        events_count INTEGER DEFAULT 0,
        user_agent TEXT,
        referrer TEXT,
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        ip_address INET,
        country VARCHAR(100),
        city VARCHAR(100),
        device_type VARCHAR(50),
        browser VARCHAR(100),
        os VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create email_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        template_name VARCHAR(100) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        provider_id VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        opened_at TIMESTAMP WITH TIME ZONE,
        clicked_at TIMESTAMP WITH TIME ZONE,
        bounced_at TIMESTAMP WITH TIME ZONE,
        complained_at TIMESTAMP WITH TIME ZONE,
        unsubscribed_at TIMESTAMP WITH TIME ZONE
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name)`
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_signups_email ON signups(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_signups_created_at ON signups(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_email ON email_logs(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at)`

    console.log("✅ Database schema initialized successfully")
    isSchemaInitialized = true
    return true
  } catch (error) {
    console.error("❌ Database initialization error:", error)
    throw error
  }
}

// Signup operations with error handling
export async function createSignup(signupData: {
  name: string
  email: string
  phone?: string
  comment?: string
  source: string
  sessionId?: string
  emailSent?: boolean
}) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const result = await sql`
      INSERT INTO signups (name, email, phone, comment, source, session_id, email_sent)
      VALUES (${signupData.name}, ${signupData.email}, ${signupData.phone || null}, 
              ${signupData.comment || null}, ${signupData.source}, 
              ${signupData.sessionId || null}, ${signupData.emailSent || false})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error creating signup:", error)

    // Check for specific PostgreSQL errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        throw new Error("Email already exists")
      }
      if (error.message.includes("authentication failed")) {
        throw new Error("Database authentication failed - check DATABASE_URL")
      }
      if (error.message.includes("connection")) {
        throw new Error("Database connection failed")
      }
      if (error.message.includes("does not exist")) {
        console.log("🚀 Table doesn't exist, initializing schema...")
        await initializeDatabase()
        // Retry the operation
        return createSignup(signupData)
      }
    }

    throw error
  }
}

export async function getSignups(limit = 50, offset = 0, emailFilter?: string) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    let query
    if (emailFilter) {
      query = sql`
        SELECT * FROM signups 
        WHERE email ILIKE ${"%" + emailFilter + "%"}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      query = sql`
        SELECT * FROM signups 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
    }
    return await query
  } catch (error) {
    console.error("Error getting signups:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return getSignups(limit, offset, emailFilter)
    }
    throw error
  }
}

export async function getSignupStats() {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const stats = await sql`
      SELECT 
        COUNT(*) as total_signups,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_signups,
        COUNT(*) FILTER (WHERE phone IS NOT NULL) as phone_provided,
        COUNT(*) FILTER (WHERE comment IS NOT NULL) as comments_provided,
        COUNT(*) FILTER (WHERE email_sent = true) as emails_sent,
        ROUND(
          (COUNT(*) FILTER (WHERE email_sent = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
        ) as email_success_rate
      FROM signups
    `

    const sourcesBreakdown = await sql`
      SELECT source, COUNT(*) as count
      FROM signups
      GROUP BY source
      ORDER BY count DESC
    `

    return {
      ...stats[0],
      sources_breakdown: sourcesBreakdown.reduce((acc: any, row: any) => {
        acc[row.source] = Number.parseInt(row.count)
        return acc
      }, {}),
    }
  } catch (error) {
    console.error("Error getting signup stats:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return getSignupStats()
    }
    throw error
  }
}

// Analytics events operations with error handling
export async function createAnalyticsEvent(eventData: {
  eventName: string
  sessionId: string
  userId?: string
  properties?: any
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  ipAddress?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const result = await sql`
      INSERT INTO analytics_events (
        event_name, session_id, user_id, properties, page_url, page_title,
        user_agent, ip_address, referrer, utm_source, utm_medium, utm_campaign
      )
      VALUES (
        ${eventData.eventName}, ${eventData.sessionId}, ${eventData.userId || null},
        ${JSON.stringify(eventData.properties || {})}, ${eventData.pageUrl || null},
        ${eventData.pageTitle || null}, ${eventData.userAgent || null},
        ${eventData.ipAddress || null}, ${eventData.referrer || null},
        ${eventData.utmSource || null}, ${eventData.utmMedium || null},
        ${eventData.utmCampaign || null}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error creating analytics event:", error)

    // Check for specific errors
    if (error instanceof Error) {
      if (error.message.includes("authentication failed")) {
        console.error("❌ Database authentication failed. Please check your DATABASE_URL")
        throw new Error("Database authentication failed")
      }
      if (error.message.includes("connection")) {
        console.error("❌ Database connection failed")
        throw new Error("Database connection failed")
      }
      if (error.message.includes("does not exist")) {
        console.log("🚀 Table doesn't exist, initializing schema...")
        await initializeDatabase()
        // Retry the operation
        return createAnalyticsEvent(eventData)
      }
    }

    throw error
  }
}

export async function getAnalyticsEvents(limit = 100, sessionId?: string) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    let query
    if (sessionId) {
      query = sql`
        SELECT * FROM analytics_events 
        WHERE session_id = ${sessionId}
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT * FROM analytics_events 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
    }
    return await query
  } catch (error) {
    console.error("Error getting analytics events:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return getAnalyticsEvents(limit, sessionId)
    }
    throw error
  }
}

export async function getAnalyticsStats() {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const stats = await sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_events,
        COUNT(*) FILTER (WHERE event_name = 'page_view') as page_views,
        COUNT(*) FILTER (WHERE event_name LIKE '%game%') as game_events,
        COUNT(*) FILTER (WHERE event_name = 'email_capture') as email_captures,
        COUNT(*) FILTER (WHERE event_name = 'cta_click') as cta_clicks
      FROM analytics_events
    `

    const eventTypes = await sql`
      SELECT event_name, COUNT(*) as count
      FROM analytics_events
      GROUP BY event_name
      ORDER BY count DESC
      LIMIT 20
    `

    const topSources = await sql`
      SELECT utm_source, COUNT(*) as count
      FROM analytics_events
      WHERE utm_source IS NOT NULL
      GROUP BY utm_source
      ORDER BY count DESC
      LIMIT 10
    `

    return {
      ...stats[0],
      event_types: eventTypes.reduce((acc: any, row: any) => {
        acc[row.event_name] = Number.parseInt(row.count)
        return acc
      }, {}),
      top_sources: topSources.reduce((acc: any, row: any) => {
        acc[row.utm_source] = Number.parseInt(row.count)
        return acc
      }, {}),
    }
  } catch (error) {
    console.error("Error getting analytics stats:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return getAnalyticsStats()
    }
    throw error
  }
}

// Session operations with error handling
export async function upsertAnalyticsSession(sessionData: {
  sessionId: string
  userId?: string
  startTime: Date
  lastActivity: Date
  pageViews: number
  eventsCount: number
  userAgent?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  ipAddress?: string
  country?: string
  city?: string
  deviceType?: string
  browser?: string
  os?: string
}) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const result = await sql`
      INSERT INTO analytics_sessions (
        session_id, user_id, start_time, last_activity, page_views, events_count,
        user_agent, referrer, utm_source, utm_medium, utm_campaign, ip_address,
        country, city, device_type, browser, os, updated_at
      )
      VALUES (
        ${sessionData.sessionId}, ${sessionData.userId || null}, ${sessionData.startTime},
        ${sessionData.lastActivity}, ${sessionData.pageViews}, ${sessionData.eventsCount},
        ${sessionData.userAgent || null}, ${sessionData.referrer || null},
        ${sessionData.utmSource || null}, ${sessionData.utmMedium || null},
        ${sessionData.utmCampaign || null}, ${sessionData.ipAddress || null},
        ${sessionData.country || null}, ${sessionData.city || null},
        ${sessionData.deviceType || null}, ${sessionData.browser || null},
        ${sessionData.os || null}, NOW()
      )
      ON CONFLICT (session_id) 
      DO UPDATE SET
        last_activity = ${sessionData.lastActivity},
        page_views = ${sessionData.pageViews},
        events_count = ${sessionData.eventsCount},
        updated_at = NOW()
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error upserting analytics session:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return upsertAnalyticsSession(sessionData)
    }
    throw error
  }
}

// Email logs operations
export async function createEmailLog(emailData: {
  email: string
  templateName: string
  provider: string
  status: string
  providerId?: string
  errorMessage?: string
}) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    const result = await sql`
      INSERT INTO email_logs (email, template_name, provider, status, provider_id, error_message)
      VALUES (${emailData.email}, ${emailData.templateName}, ${emailData.provider}, 
              ${emailData.status}, ${emailData.providerId || null}, ${emailData.errorMessage || null})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("Error creating email log:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return createEmailLog(emailData)
    }
    throw error
  }
}

export async function getEmailLogs(limit = 50, email?: string) {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    let query
    if (email) {
      query = sql`
        SELECT * FROM email_logs 
        WHERE email = ${email}
        ORDER BY sent_at DESC 
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT * FROM email_logs 
        ORDER BY sent_at DESC 
        LIMIT ${limit}
      `
    }
    return await query
  } catch (error) {
    console.error("Error getting email logs:", error)
    if (error instanceof Error && error.message.includes("does not exist")) {
      await initializeDatabase()
      return getEmailLogs(limit, email)
    }
    throw error
  }
}

// Cleanup operations
export async function clearAllData() {
  try {
    // Ensure schema exists before operation
    await ensureSchemaExists()

    await sql`DELETE FROM analytics_events`
    await sql`DELETE FROM analytics_sessions`
    await sql`DELETE FROM signups`
    await sql`DELETE FROM email_logs`
    console.log("🗑️ All data cleared from database")
    return true
  } catch (error) {
    console.error("Error clearing data:", error)
    throw error
  }
}

// Fallback storage for when database is not available
class FallbackStorage {
  private signups: any[] = []
  private events: any[] = []
  private sessions: any[] = []

  async createSignup(data: any) {
    const signup = { ...data, id: this.signups.length + 1, created_at: new Date() }
    this.signups.push(signup)
    console.log("📝 Fallback: Signup stored in memory")
    return signup
  }

  async createEvent(data: any) {
    const event = { ...data, id: this.events.length + 1, created_at: new Date() }
    this.events.push(event)
    console.log("📝 Fallback: Event stored in memory")
    return event
  }

  async getSignups() {
    return this.signups
  }

  async getEvents() {
    return this.events
  }

  async getStats() {
    return {
      total_signups: this.signups.length,
      total_events: this.events.length,
      today_signups: 0,
      today_events: 0,
    }
  }

  clear() {
    this.signups = []
    this.events = []
    this.sessions = []
    console.log("🗑️ Fallback storage cleared")
  }
}

export const fallbackStorage = new FallbackStorage()
