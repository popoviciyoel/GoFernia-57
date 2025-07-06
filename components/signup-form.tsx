"use client"

import type React from "react"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAnalytics } from "@/lib/analytics"

interface SignupFormProps {
  isOpen: boolean
  onClose: () => void
  source: string
}

interface FormData {
  name: string
  email: string
  phone: string
  comment: string
}

export function SignupForm({ isOpen, onClose, source }: SignupFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState("")

  const analytics = useAnalytics()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Track form submission attempt
      analytics.track("signup_form_submit_attempt", {
        source,
        has_phone: !!formData.phone,
        has_comment: !!formData.comment,
        name_length: formData.name.length,
        email_domain: formData.email.split("@")[1],
      })

      // Submit to backend API
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          comment: formData.comment || undefined,
          source,
          sessionId: analytics.getSessionData().sessionId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Submission failed")
      }

      console.log("✅ Form submitted successfully:", result)

      // Track successful submission
      analytics.track("signup_form_submit_success", {
        source,
        user_email: formData.email,
        signup_id: result.data?.id,
      })

      // Track email capture for analytics
      analytics.trackEmailCapture(formData.email, source)

      setIsSubmitted(true)

      // Auto-close after success message
      setTimeout(() => {
        onClose()
        resetForm()
      }, 3000)
    } catch (error) {
      console.error("Form submission error:", error)

      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again."
      setSubmitError(errorMessage)

      // Track submission error
      analytics.track("signup_form_submit_error", {
        source,
        error: errorMessage,
        email_domain: formData.email.split("@")[1],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (submitError) {
      setSubmitError("")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", comment: "" })
    setErrors({})
    setSubmitError("")
    setIsSubmitted(false)
  }

  const handleClose = () => {
    analytics.track("signup_form_close", {
      source,
      form_completed: isSubmitted,
      fields_filled: Object.values(formData).filter(Boolean).length,
    })
    onClose()

    // Reset form after a delay to avoid flash
    setTimeout(resetForm, 300)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardHeader className="relative">
          <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-8 w-8 p-0" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-bold text-center">
            {isSubmitted ? "Welcome to GoFernia!" : "Start Your Free Trial"}
          </CardTitle>
          {!isSubmitted && (
            <p className="text-center text-gray-600 mt-2">Join fashion brands already growing with gamification</p>
          )}
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thanks for joining the beta!</h3>
              <p className="text-gray-600">We'll be in touch soon with your access details and next steps.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Questions or Comments (Optional)</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => handleInputChange("comment", e.target.value)}
                  placeholder="Tell us about your store or any questions you have..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By signing up, you agree to receive updates about GoFernia. No spam, unsubscribe anytime.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
