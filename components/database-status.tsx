"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

export function DatabaseStatus() {
  const [status, setStatus] = useState<{ connected: boolean; message: string } | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/database-test")
        const result = await response.json()
        setStatus({
          connected: result.success,
          message: result.success ? "Database Connected" : "Database Offline",
        })
      } catch (error) {
        setStatus({
          connected: false,
          message: "Database Offline",
        })
      }
    }

    checkStatus()
  }, [])

  if (!status) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Badge variant={status.connected ? "default" : "destructive"} className="text-xs">
        {status.connected ? "🟢" : "🔴"} {status.message}
      </Badge>
    </div>
  )
}
