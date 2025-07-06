"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Send, Settings, BarChart3 } from "lucide-react"

export default function MailgunAdminPage() {
  const [providerInfo, setProviderInfo] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("")
  const [testName, setTestName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    loadProviderInfo()
  }, [])

  const loadProviderInfo = async () => {
    try {
      const response = await fetch("/api/mailgun-test")
      if (response.ok) {
        const data = await response.json()
        setProviderInfo(data)
      }
    } catch (error) {
      console.error("Failed to load provider info:", error)
    }
  }

  const sendTestEmail = async (template: string) => {
    if (!testEmail || !testName) {
      alert("Please enter both email and name")
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/mailgun-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          name: testName,
          template,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      console.error("Test email error:", error)
      setTestResult({ success: false, error: "Failed to send test email" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mailgun Email Management</h1>
          <p className="text-gray-600">Test and monitor your Mailgun email integration</p>
        </div>

        {/* Provider Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {providerInfo ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Configuration</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <Badge variant={providerInfo.provider.provider === "mailgun" ? "default" : "secondary"}>
                        {providerInfo.provider.provider}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Domain:</span>
                      <span className="font-mono text-sm">{providerInfo.provider.domain || "Not configured"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From Email:</span>
                      <span className="font-mono text-sm">{providerInfo.provider.fromEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From Name:</span>
                      <span>{providerInfo.provider.fromName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Mailgun Features</h3>
                  <div className="space-y-2">
                    {providerInfo.mailgunFeatures &&
                      Object.entries(providerInfo.mailgunFeatures).map(([feature, description]) => (
                        <div key={feature} className="text-sm">
                          <span className="font-medium text-gray-900 capitalize">
                            {feature.replace(/([A-Z])/g, " $1")}:
                          </span>
                          <span className="text-gray-600 ml-2">{description as string}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">Loading provider information...</div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="test" className="space-y-6">
          <TabsList>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Test Emails
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Emails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Test Email Address</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-name">Test Name</Label>
                    <Input
                      id="test-name"
                      type="text"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => sendTestEmail("welcome")} disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Welcome Email"}
                  </Button>
                  <Button onClick={() => sendTestEmail("confirmation")} variant="outline" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Confirmation Email"}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-lg ${
                      testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={testResult.success ? "default" : "destructive"}>
                        {testResult.success ? "Success" : "Error"}
                      </Badge>
                      <span className="text-sm font-medium">{testResult.message}</span>
                    </div>
                    {testResult.provider && (
                      <div className="text-xs text-gray-600">
                        Provider: {testResult.provider.provider} | Domain: {testResult.provider.domain}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Welcome Email Template</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Comprehensive onboarding email with features, next steps, and personalized content.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">HTML</Badge>
                      <Badge variant="outline">Text</Badge>
                      <Badge variant="outline">Responsive</Badge>
                      <Badge variant="outline">Personalized</Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Confirmation Email Template</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Simple confirmation message sent immediately after signup.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">HTML</Badge>
                      <Badge variant="outline">Text</Badge>
                      <Badge variant="outline">Quick</Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="font-semibold mb-2">Mailgun Template Support</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You can also create templates directly in your Mailgun dashboard and use them via the API.
                    </p>
                    <Button variant="outline" size="sm">
                      View Mailgun Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Email Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">📧</div>
                      <div className="text-sm text-gray-600 mt-2">Email Tracking</div>
                      <div className="text-xs text-gray-500 mt-1">Opens & clicks tracked automatically</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">📊</div>
                      <div className="text-sm text-gray-600 mt-2">Delivery Reports</div>
                      <div className="text-xs text-gray-500 mt-1">Real-time delivery status</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">🔗</div>
                      <div className="text-sm text-gray-600 mt-2">Webhooks</div>
                      <div className="text-xs text-gray-500 mt-1">Event notifications available</div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">Available Mailgun Analytics</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Email delivery rates and bounce tracking</li>
                      <li>• Open rates and click-through rates</li>
                      <li>• Spam complaint monitoring</li>
                      <li>• Unsubscribe tracking</li>
                      <li>• Real-time event webhooks</li>
                      <li>• Domain reputation monitoring</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">📈 Pro Tip</h4>
                    <p className="text-sm text-yellow-700">
                      Set up Mailgun webhooks to receive real-time notifications about email events and automatically
                      update your user records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
