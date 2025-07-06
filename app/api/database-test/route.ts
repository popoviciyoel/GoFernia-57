import { NextResponse } from "next/server"
import { testDatabaseConnection, initializeDatabase } from "@/lib/database"

export async function GET() {
  try {
    console.log("🧪 Testing database connection...")

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL environment variable not set",
        suggestions: [
          "Add DATABASE_URL to your .env.local file",
          "Get your connection string from Neon dashboard",
          "Format: postgresql://user:pass@host/db?sslmode=require",
        ],
      })
    }

    // Parse and validate the URL
    let parsedUrl
    try {
      parsedUrl = new URL(process.env.DATABASE_URL)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL format is invalid",
        suggestions: [
          "Check your DATABASE_URL format",
          "Should start with postgresql:// or postgres://",
          "Include username, password, host, and database name",
        ],
      })
    }

    // Log connection details (without password)
    console.log("🔗 Connection details:", {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || "default",
      pathname: parsedUrl.pathname,
      username: parsedUrl.username,
      ssl: parsedUrl.searchParams.get("sslmode"),
    })

    // Test the connection
    const isConnected = await testDatabaseConnection()

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        connectionDetails: {
          host: parsedUrl.hostname,
          database: parsedUrl.pathname.slice(1),
          user: parsedUrl.username,
          ssl: parsedUrl.searchParams.get("sslmode"),
        },
        suggestions: [
          "Verify your username and password are correct",
          "Check that your Neon database is running (not paused)",
          "Ensure your IP is whitelisted in Neon settings",
          "Try connecting directly from Neon dashboard first",
        ],
      })
    }

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      connectionDetails: {
        host: parsedUrl.hostname,
        database: parsedUrl.pathname.slice(1),
        user: parsedUrl.username,
        ssl: parsedUrl.searchParams.get("sslmode"),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database test error:", error)

    let errorMessage = "Unknown database error"
    let suggestions: string[] = []

    if (error instanceof Error) {
      errorMessage = error.message

      if (error.message.includes("password authentication failed")) {
        suggestions = [
          "Double-check your password in DATABASE_URL",
          "Verify credentials in your Neon dashboard",
          "Make sure you're using the correct user (neondb_owner)",
          "Try resetting your database password in Neon",
        ]
      } else if (error.message.includes("connection")) {
        suggestions = [
          "Check your internet connection",
          "Verify the database host is correct",
          "Ensure the database is running (not paused)",
          "Check if your IP needs to be whitelisted",
        ]
      } else if (error.message.includes("does not exist")) {
        suggestions = [
          "Check the database name in your URL",
          "Create the database in Neon dashboard",
          "Verify the database exists and is accessible",
        ]
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        suggestions,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    console.log("🚀 Initializing database schema...")

    await initializeDatabase()

    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Database initialization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database initialization failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
