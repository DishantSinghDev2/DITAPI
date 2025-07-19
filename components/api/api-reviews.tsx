"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import type { API, Review, UserSession } from "@/types/api"
import { ApiService } from "@/lib/api-service"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ApiReviewsProps {
  api: API
  reviews: Review[]
  currentUser?: UserSession
}

export function ApiReviews({ api, reviews, currentUser }: ApiReviewsProps) {
  const router = useRouter()
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" })
  const [submitting, setSubmitting] = useState(false)

  const handleRatingChange = (rating: number) => {
    setNewReview((prev) => ({ ...prev, rating }))
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewReview((prev) => ({ ...prev, comment: e.target.value }))
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a review.",
        variant: "destructive",
      })
      return
    }
    if (newReview.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating for your review.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const createdReview = await ApiService.createReview({
        apiId: api.id,
        userId: currentUser.id,
        rating: newReview.rating,
        comment: newReview.comment,
      })
      if (createdReview) {
        toast({
          title: "Review Submitted",
          description: "Your review has been successfully submitted.",
        })
        setNewReview({ rating: 0, comment: "" })
        router.refresh() // Revalidate data
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to submit review: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews for {api.name}</CardTitle>
        <CardDescription>Read what other developers are saying about this API.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Submit Review Form */}
        {currentUser && (
          <div className="border-b pb-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Your Rating</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer ${
                        star <= newReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
                      onClick={() => handleRatingChange(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Your Comment</Label>
                <Textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={handleCommentChange}
                  rows={4}
                  placeholder="Share your experience with this API..."
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </div>
        )}

        {/* Existing Reviews */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground">No reviews yet. Be the first to review this API!</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">
                    {review.userId} {/* TODO: Replace with reviewer's username */}
                  </p>
                  <p className="text-gray-700">{review.comment}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
