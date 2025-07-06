import { initializeDatabase, testDatabaseConnection } from "../lib/database.js"

async function main() {
  try {
    console.log("🚀 Starting database initialization...")

    // First test the connection
    console.log("🔍 Testing database connection...")
    const isConnected = await testDatabaseConnection()

    if (!isConnected) {
      console.error("❌ Database connection failed!")
      console.log("💡 Please check:")
      console.log("   - DATABASE_URL is set correctly in .env.local")
      console.log("   - Your Neon database is running")
      console.log("   - Username and password are correct")
      process.exit(1)
    }

    console.log("✅ Database connection successful!")

    // Initialize the schema
    console.log("📋 Creating database tables...")
    await initializeDatabase()

    console.log("🎉 Database initialization completed successfully!")
    console.log("📊 You can now:")
    console.log("   - Visit /admin/database to see connection status")
    console.log("   - Test signups and analytics tracking")
    console.log("   - View data in /admin/signups and /analytics")

    process.exit(0)
  } catch (error) {
    console.error("❌ Database initialization failed:", error)

    if (error.message.includes("authentication failed")) {
      console.log("🔐 Authentication Error - Check:")
      console.log("   - Username: neondb_owner")
      console.log("   - Password in DATABASE_URL is correct")
      console.log("   - Database name: neondb")
    } else if (error.message.includes("connection")) {
      console.log("🌐 Connection Error - Check:")
      console.log("   - Internet connection")
      console.log("   - Neon database is running")
      console.log("   - Host URL is correct")
    }

    process.exit(1)
  }
}

main()
