"use client"

import type React from "react"

import { useEffect } from "react"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics on mount
    console.log("Analytics initialized")
  }, [])

  return <>{children}</>
}
