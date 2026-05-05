"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createOffer } from "@/app/actions/offers"
import { useState } from "react"

const OFFER_TYPES = [
  { value: "festive", label: "🎉 Festive Offer" },
  { value: "staff", label: "👥 Staff Offer" },
  { value: "season", label: "🌿 Season Offer" },
  { value: "referral", label: "🔗 Referral Offer" },
  { value: "student", label: "🎓 Student Offer" },
  { value: "flash", label: "⚡ Flash Sale" },
  { value: "other", label: "🏷️ Other" },
]

const APPLICABLE_TO_OPTIONS = [
  { value: "all_classes", label: "All Classes" },
  { value: "ballet", label: "Ballet" },
  { value: "contemporary", label: "Contemporary" },
  { value: "hip_hop", label: "Hip Hop" },
  { value: "salsa", label: "Salsa" },
  { value: "membership", label: "Membership" },
  { value: "workshops", label: "Workshops" },
]

export function AddOfferDialog() {
  const [open, setOpen] = useState(false)
  const [offerType, setOfferType] = useState("")
  const [discountType, setDiscountType] = useState("percentage")
  const [status, setStatus] = useState("active")
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(createOffer, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      router.refresh()
    }
  }, [state, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Offer</DialogTitle>
          <DialogDescription>
            Add a new promotional offer for your studio. Configure the discount type, validity period, and eligibility.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          {/* Hidden selects for controlled fields */}
          <input type="hidden" name="offerType" value={offerType} />
          <input type="hidden" name="discountType" value={discountType} />
          <input type="hidden" name="status" value={status} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="add-offer-title">Offer Title *</Label>
              <Input
                id="add-offer-title"
                name="title"
                placeholder="e.g. Diwali Special — 20% Off"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-offer-type">Offer Type *</Label>
              <Select value={offerType} onValueChange={setOfferType} required>
                <SelectTrigger id="add-offer-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-offer-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="add-offer-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-discount-type">Discount Type *</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger id="add-discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-discount-value">
                Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="add-discount-value"
                name="discountValue"
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step="0.01"
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-coupon-code">Coupon Code</Label>
              <Input
                id="add-coupon-code"
                name="couponCode"
                placeholder="e.g. DIWALI20"
                disabled={isPending}
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-usage-limit">Usage Limit</Label>
              <Input
                id="add-usage-limit"
                name="usageLimit"
                type="number"
                min="1"
                placeholder="Leave empty for unlimited"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-min-purchase">Min Purchase Amount (₹)</Label>
              <Input
                id="add-min-purchase"
                name="minPurchaseAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-max-discount">Max Discount Amount (₹)</Label>
              <Input
                id="add-max-discount"
                name="maxDiscountAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional cap"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-start-date">Start Date *</Label>
              <Input
                id="add-start-date"
                name="startDate"
                type="date"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-end-date">End Date</Label>
              <Input
                id="add-end-date"
                name="endDate"
                type="date"
                disabled={isPending}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="add-offer-description">Description</Label>
              <Textarea
                id="add-offer-description"
                name="description"
                placeholder="Describe the offer terms, eligibility, etc."
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="add-offer-notes">Internal Notes</Label>
              <Textarea
                id="add-offer-notes"
                name="notes"
                placeholder="Internal notes (not shown to students)"
                rows={2}
                disabled={isPending}
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !offerType}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Offer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
