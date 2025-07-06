"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Mail, TrendingUp, Heart, Zap, Clock, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAnalytics } from "@/lib/analytics"
import { SignupForm } from "@/components/signup-form"
import { DatabaseStatus } from "@/components/database-status"

export default function HomePage() {
  const analytics = useAnalytics()

  const [isSignupFormOpen, setIsSignupFormOpen] = useState(false)
  const [signupSource, setSignupSource] = useState("")

  useEffect(() => {
    // Track page-specific events
    analytics.track("homepage_view", {
      page_type: "landing",
    })

    // Log to console for debugging
    console.log("🏠 Homepage loaded - Analytics initialized")
  }, [analytics])

  const handleCTAClick = (ctaText: string, location: string) => {
    console.log(`🎯 CTA Clicked: ${ctaText} at ${location}`)
    analytics.trackCTAClick(ctaText, location)

    // Open signup form
    setSignupSource(location)
    setIsSignupFormOpen(true)

    // Track form open
    analytics.track("signup_form_open", {
      source: location,
      cta_text: ctaText,
    })
  }

  const handleFeatureCardHover = (feature: string) => {
    console.log(`👆 Feature card hovered: ${feature}`)
    analytics.track("feature_card_hover", {
      feature_name: feature,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center text-sm font-medium">
        🚀 Limited Beta Access - Join Fashion Brands Already Growing Their Lists
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GoFernia</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => handleCTAClick("Start Free Trial", "nav")}
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Traffic into Fans with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Play-to-Win
            </span>{" "}
            Experiences
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Bring play to your fashion e-commerce store with interactive mini-games designed to engage visitors, collect
            emails, and enhance the shopping experience. We're helping brands explore a new way to grow through
            gamification—backed by strong early interest and promising feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
              onClick={() => handleCTAClick("Start Free Trial", "hero_primary")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Fashion Brands Choose GoFernia</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Proven results that transform your store into an engaging, conversion-optimized experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card
            className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm cursor-pointer"
            onMouseEnter={() => handleFeatureCardHover("Collect More Emails")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Collect More Emails</h3>
              <p className="text-gray-600 leading-relaxed">
                Interactive games have been shown to capture significantly more email signups than standard pop-ups.
                We're helping brands turn anonymous visitors into engaged subscribers—one game at a time.
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm cursor-pointer"
            onMouseEnter={() => handleFeatureCardHover("Boost Conversion Rates")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Boost Conversion Rates</h3>
              <p className="text-gray-600 leading-relaxed">
                Gamified experiences are proven to boost engagement and drive stronger purchase intent. Create urgency
                and excitement that encourages immediate action.
              </p>
            </CardContent>
          </Card>

          <Card
            className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm cursor-pointer"
            onMouseEnter={() => handleFeatureCardHover("Delight Shoppers")}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Delight Shoppers</h3>
              <p className="text-gray-600 leading-relaxed">
                Create memorable brand moments that customers love to share. Build loyalty through fun, interactive
                experiences.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gamification Psychology Section */}
      <section className="bg-white/40 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700">Psychology of Gamification</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Science Behind Play-to-Win</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gamification taps into fundamental human psychology to drive the behaviors that matter most to your
              business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Desired Action */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Drive Desired Actions</h3>
                <p className="text-gray-600 mb-6">
                  Games naturally motivate customers to complete specific actions through rewards and progression
                  systems.
                </p>
              </CardContent>
            </Card>

            {/* Sense of Urgency */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create Urgency</h3>
                <p className="text-gray-600 mb-6">
                  Time-limited games and expiring rewards trigger FOMO (Fear of Missing Out) and accelerate
                  decision-making.
                </p>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Build Social Proof</h3>
                <p className="text-gray-600 mb-6">
                  Shareable games and visible participation create viral loops and demonstrate popularity to new
                  visitors.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Psychology Insights */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="border-0 bg-gradient-to-r from-purple-50 to-blue-50 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">The Gamification Advantage</h3>
                  <p className="text-gray-600">How games trigger powerful psychological responses</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🧠 Dopamine Release</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Games trigger dopamine release through variable reward schedules, creating addiction-like
                      engagement with your brand.
                    </p>

                    <h4 className="font-semibold text-gray-900 mb-3">🎯 Goal-Oriented Behavior</h4>
                    <p className="text-sm text-gray-600">
                      Clear objectives and progress tracking motivate customers to complete desired actions like email
                      signups and purchases.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">🏆 Achievement Psychology</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Winning creates positive associations with your brand, increasing customer lifetime value and
                      loyalty.
                    </p>

                    <h4 className="font-semibold text-gray-900 mb-3">👥 Social Validation</h4>
                    <p className="text-sm text-gray-600">
                      Sharing game results provides social validation and creates authentic word-of-mouth marketing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Gamify Your Store?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the beta and start growing your email list today. No credit card required.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
              onClick={() => handleCTAClick("Start Free Trial", "bottom_cta_primary")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Database Status Indicator */}
      <DatabaseStatus />

      {/* Signup Form Modal */}
      <SignupForm isOpen={isSignupFormOpen} onClose={() => setIsSignupFormOpen(false)} source={signupSource} />
    </div>
  )
}
