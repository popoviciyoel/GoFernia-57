"use client"

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
}

interface UserSession {
  sessionId: string
  startTime: number
  lastActivity: number
  pageViews: number
  events: AnalyticsEvent[]
  userAgent: string
  referrer: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

class Analytics {
  private sessionId: string
  private userId?: string
  private session: UserSession
  private eventQueue: AnalyticsEvent[] = []
  private isInitialized = false
  private gtmLoaded = false

  constructor() {
    if (typeof window === "undefined") {
      // Server-side fallback
      this.sessionId = "server"
      this.session = {} as UserSession
      return
    }

    this.sessionId = this.generateSessionId()
    this.session = this.initializeSession()
    this.init()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeSession(): UserSession {
    if (typeof window === "undefined") {
      return {} as UserSession
    }

    const urlParams = new URLSearchParams(window.location.search)

    return {
      sessionId: this.sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      utmSource: urlParams.get("utm_source") || undefined,
      utmMedium: urlParams.get("utm_medium") || undefined,
      utmCampaign: urlParams.get("utm_campaign") || undefined,
    }
  }

  private init() {
    if (typeof window === "undefined") return

    console.log("🚀 Analytics system initialized")
    console.log("📊 Session ID:", this.sessionId)

    // Initialize GTM
    this.initGTM()

    // Track page load
    this.trackPageView()

    // Track scroll depth
    this.trackScrollDepth()

    // Track time on page
    this.trackTimeOnPage()

    // Track clicks
    this.trackClicks()

    // Track form interactions
    this.trackFormInteractions()

    // Track exit intent
    this.trackExitIntent()

    // Send queued events periodically to server
    setInterval(() => this.flushEventsToServer(), 30000) // Every 30 seconds

    // Send events before page unload
    window.addEventListener("beforeunload", () => this.flushEventsToServer())

    this.isInitialized = true
  }

  private initGTM() {
    if (typeof window === "undefined") return

    // Check if GTM is already loaded
    if (window.dataLayer) {
      this.gtmLoaded = true
      console.log("🏷️ GTM already loaded")
      return
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || []

    // GTM script injection (you'd replace GTM-XXXXXXX with your actual GTM ID)
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "GTM-XXXXXXX"

    // Add GTM script to head
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
    document.head.appendChild(script)

    // Add GTM initialization
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    })

    this.gtmLoaded = true
    console.log("🏷️ GTM initialized with ID:", gtmId)
  }

  private pushToGTM(event: string, properties: Record<string, any>) {
    if (typeof window === "undefined" || !window.dataLayer) return

    const gtmEvent = {
      event: event,
      ...properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    }

    window.dataLayer.push(gtmEvent)
    console.log("🏷️ GTM Event pushed:", gtmEvent)

    // Also send to our GTM API endpoint for server-side processing
    this.sendToGTMAPI(event, properties)
  }

  private async sendToGTMAPI(event: string, properties: Record<string, any>) {
    try {
      await fetch("/api/analytics/gtm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event, properties }),
      })
    } catch (error) {
      console.warn("Failed to send GTM event to API:", error)
    }
  }

  private trackPageView() {
    if (typeof window === "undefined") return

    this.session.pageViews++
    this.track("page_view", {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer,
      utm_source: this.session.utmSource,
      utm_medium: this.session.utmMedium,
      utm_campaign: this.session.utmCampaign,
    })
  }

  private trackScrollDepth() {
    if (typeof window === "undefined") return

    let maxScroll = 0
    const scrollMilestones = [25, 50, 75, 90, 100]
    const trackedMilestones = new Set<number>()

    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent

        scrollMilestones.forEach((milestone) => {
          if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
            trackedMilestones.add(milestone)
            this.track("scroll_depth", {
              depth_percent: milestone,
              max_scroll: maxScroll,
            })
          }
        })
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
  }

  private trackTimeOnPage() {
    if (typeof window === "undefined") return

    let startTime = Date.now()
    let isActive = true

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false
        this.track("page_inactive", {
          time_active: Date.now() - startTime,
        })
      } else {
        isActive = true
        startTime = Date.now()
        this.track("page_active", {})
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    const timeMilestones = [10, 30, 60, 120, 300]
    timeMilestones.forEach((seconds) => {
      setTimeout(() => {
        if (isActive) {
          this.track("time_on_page", {
            seconds_on_page: seconds,
          })
        }
      }, seconds * 1000)
    })
  }

  private trackClicks() {
    if (typeof window === "undefined") return

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      const className = target.className
      const id = target.id
      const text = target.textContent?.slice(0, 100) || ""

      if (tagName === "button" || target.closest("button")) {
        const button = tagName === "button" ? target : target.closest("button")!
        this.track("button_click", {
          button_text: button.textContent?.slice(0, 100) || "",
          button_class: button.className,
          button_id: button.id,
          page_url: window.location.href,
        })
      }

      if (tagName === "a" || target.closest("a")) {
        const link = tagName === "a" ? (target as HTMLAnchorElement) : target.closest("a")!
        this.track("link_click", {
          link_url: link.href,
          link_text: link.textContent?.slice(0, 100) || "",
          is_external: !link.href.includes(window.location.hostname),
        })
      }

      this.track("click", {
        element_tag: tagName,
        element_class: className,
        element_id: id,
        element_text: text,
        x: event.clientX,
        y: event.clientY,
      })
    })
  }

  private trackFormInteractions() {
    if (typeof window === "undefined") return

    document.addEventListener("submit", (event) => {
      const form = event.target as HTMLFormElement
      const formData = new FormData(form)
      const fields: Record<string, any> = {}

      formData.forEach((value, key) => {
        fields[key] = typeof value === "string" ? "text" : "file"
      })

      this.track("form_submit", {
        form_id: form.id,
        form_class: form.className,
        field_count: Object.keys(fields).length,
        fields: Object.keys(fields),
      })
    })

    document.addEventListener(
      "focus",
      (event) => {
        const target = event.target as HTMLElement
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          this.track("input_focus", {
            input_type: (target as HTMLInputElement).type || "textarea",
            input_name: (target as HTMLInputElement).name,
            input_id: target.id,
          })
        }
      },
      true,
    )
  }

  private trackExitIntent() {
    if (typeof window === "undefined") return

    let hasTrackedExitIntent = false

    document.addEventListener("mouseleave", (event) => {
      if (event.clientY <= 0 && !hasTrackedExitIntent) {
        hasTrackedExitIntent = true
        this.track("exit_intent", {
          time_on_page: Date.now() - this.session.startTime,
          page_url: window.location.href,
        })
      }
    })
  }

  track(event: string, properties: Record<string, any> = {}) {
    if (typeof window === "undefined") return

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        user_id: this.userId,
        page_url: window.location.href,
        page_title: document.title,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    }

    this.eventQueue.push(analyticsEvent)
    this.session.events.push(analyticsEvent)
    this.session.lastActivity = Date.now()

    // Store locally as backup
    this.storeSession()

    // Push to GTM
    this.pushToGTM(event, analyticsEvent.properties)

    // Enhanced console logging
    console.log(`📊 Analytics Event: ${event}`, {
      event: analyticsEvent.event,
      properties: analyticsEvent.properties,
      timestamp: new Date(analyticsEvent.timestamp).toLocaleTimeString(),
    })
  }

  identify(userId: string, properties: Record<string, any> = {}) {
    this.userId = userId
    this.track("user_identify", {
      user_id: userId,
      ...properties,
    })
  }

  trackGameStart(gameType: string) {
    this.track("game_start", {
      game_type: gameType,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  trackGameComplete(gameType: string, result: string, timeSpent: number) {
    this.track("game_complete", {
      game_type: gameType,
      result,
      time_spent_ms: timeSpent,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  trackGameAbandoned(gameType: string, timeSpent: number, progress?: number) {
    this.track("game_abandoned", {
      game_type: gameType,
      time_spent_ms: timeSpent,
      progress_percent: progress,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  trackEmailCapture(email: string, source: string, gameType?: string) {
    this.track("email_capture", {
      email_domain: email.split("@")[1],
      source,
      game_type: gameType,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  trackCTAClick(ctaText: string, ctaLocation: string) {
    this.track("cta_click", {
      cta_text: ctaText,
      cta_location: ctaLocation,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  trackDemoRequest(source: string) {
    this.track("demo_request", {
      source,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    })
  }

  private storeSession() {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("analytics_session", JSON.stringify(this.session))
    } catch (error) {
      console.warn("Failed to store analytics session:", error)
    }
  }

  private async flushEventsToServer() {
    if (typeof window === "undefined" || this.eventQueue.length === 0) return

    try {
      const eventsToSend = [...this.eventQueue]
      const sessionToSend = { ...this.session }

      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionData: sessionToSend,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`💾 Server: Flushed ${eventsToSend.length} events`, result)
        this.eventQueue = [] // Clear queue after successful send
      } else {
        console.warn("Failed to send events to server:", response.statusText)
      }
    } catch (error) {
      console.warn("Failed to flush analytics events to server:", error)
      // Keep events in queue for retry
    }

    // Also store locally as backup
    try {
      const existingEvents = JSON.parse(localStorage.getItem("analytics_events") || "[]")
      const allEvents = [...existingEvents, ...this.eventQueue]
      localStorage.setItem("analytics_events", JSON.stringify(allEvents))
    } catch (error) {
      console.warn("Failed to store events locally:", error)
    }
  }

  getSessionData() {
    return this.session
  }

  getAllEvents() {
    if (typeof window === "undefined") return []

    try {
      return JSON.parse(localStorage.getItem("analytics_events") || "[]")
    } catch {
      return []
    }
  }

  async getServerEvents() {
    try {
      const response = await fetch(`/api/analytics?sessionId=${this.sessionId}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.warn("Failed to fetch server events:", error)
    }
    return { events: [], stats: {} }
  }

  async clearData() {
    if (typeof window === "undefined") return

    // Clear local storage
    localStorage.removeItem("analytics_session")
    localStorage.removeItem("analytics_events")
    this.eventQueue = []

    // Clear server data
    try {
      await fetch("/api/analytics", { method: "DELETE" })
      console.log("🗑️ Server and local analytics data cleared")
    } catch (error) {
      console.warn("Failed to clear server data:", error)
    }
  }
}

// Extend Window interface for GTM
declare global {
  interface Window {
    dataLayer: any[]
  }
}

let analyticsInstance: Analytics | null = null

export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new Analytics()
  }
  return analyticsInstance
}

export function useAnalytics() {
  return getAnalytics()
}

export const analytics = getAnalytics()
