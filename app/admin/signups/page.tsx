"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2, RefreshCw, Search } from "lucide-react"

interface Signup {
  name: string
  email: string
  phone?: string
  comment?: string
  source: string
  timestamp: number
  sessionId?: string
}

interface SignupStats {
  totalSignups: number
  todaySignups: number
  sourcesBreakdown: Record<string, number>
  phoneProvided: number
  commentsProvided: number
  emailsSent?: number
  emailSuccessRate?: number
}

export default function SignupsAdminPage() {
  const [signups, setSignups] = useState<Signup[]>([])
  const [stats, setStats] = useState<SignupStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState("")

  useEffect(() => {
    loadSignups()
  }, [])

  const loadSignups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/signup")
      if (response.ok) {
        const data = await response.json()
        setSignups(data.signups || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Failed to load signups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllSignups = async () => {
    if (!confirm("Are you sure you want to delete all signup data? This cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/signup", { method: "DELETE" })
      if (response.ok) {
        setSignups([])
        setStats(null)
        console.log("All signup data cleared")
      }
    } catch (error) {
      console.error("Failed to clear signups:", error)
    }
  }

  const searchSignups = async () => {
    if (!searchEmail.trim()) {
      loadSignups()
      return
    }

    try {
      const response = await fetch(`/api/signup?email=${encodeURIComponent(searchEmail)}`)
      if (response.ok) {
        const data = await response.json()
        setSignups(data.signups || [])
      }
    } catch (error) {
      console.error("Failed to search signups:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Signups Dashboard</h1>
          <p className="text-gray-600">Manage and view all GoFernia signups</p>

          <div className="mt-4 flex gap-4 items-center">
            <Button onClick={loadSignups} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={clearAllSignups}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
            <div className="flex gap-2">
              <Input
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-64"
              />
              <Button onClick={searchSignups}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSignups}</div>
                <div className="text-sm text-gray-600">Total Signups</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.todaySignups}</div>
                <div className="text-sm text-gray-600">Today</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.phoneProvided}</div>
                <div className="text-sm text-gray-600">With Phone</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.commentsProvided}</div>
                <div className="text-sm text-gray-600">With Comments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.emailsSent || 0}</div>
                <div className="text-sm text-gray-600">Emails Sent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.emailSuccessRate || 0}%</div>
                <div className="text-sm text-gray-600">Email Success</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sources Breakdown */}
        {stats && Object.keys(stats.sourcesBreakdown).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Signup Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.sourcesBreakdown).map(([source, count]) => (
                  <Badge key={source} variant="outline" className="text-sm">
                    {source.replace("_", " ")}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signups List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups ({signups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading signups...</div>
            ) : signups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No signups yet. Share your website to start collecting leads!
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {signups.map((signup, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{signup.name}</h3>
                        <p className="text-gray-600">{signup.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{signup.source.replace("_", " ")}</Badge>
                        <p className="text-xs text-gray-500 mt-1">{new Date(signup.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    {signup.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Phone:</strong> {signup.phone}
                      </p>
                    )}

                    {signup.comment && (
                      <p className="text-sm text-gray-600">
                        <strong>Comment:</strong> {signup.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
