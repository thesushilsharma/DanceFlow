"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { updateOffer, type Offer } from "@/app/actions/offers"
import { Loader2 } from "lucide-react"

const OFFER_TYPES = [
  { value: "festive",  label: "🎉 Festive Offer" },
  { value: "staff",   label: "👥 Staff Offer" },
  { value: "season",  label: "🌿 Season Offer" },
  { value: "referral",label: "🔗 Referral Offer" },
  { value: "student", label: "🎓 Student Offer" },
  { value: "flash",   label: "⚡ Flash Sale" },
  { value: "other",   label: "🏷️ Other" },
]

interface EditOfferDialogProps {
  offer: Offer
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function EditOfferDialog({ offer, open: controlledOpen, onOpenChange: setControlledOpen, children }: EditOfferDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = setControlledOpen || setUncontrolledOpen
  const [offerType, setOfferType] = useState(offer.offerType)
  const [discountType, setDiscountType] = useState(offer.discountType)
  const [status, setStatus] = useState(offer.status)
  const router = useRouter()

  // Bind updateOffer with the specific offerId
  const boundUpdate = updateOffer.bind(null, offer.id)
  const [state, formAction, isPending] = useActionState(boundUpdate, null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      router.refresh()
    }
  }, [state, router])

  // Reset fields when dialog opens
  useEffect(() => {
    if (open) {
      setOfferType(offer.offerType)
      setDiscountType(offer.discountType)
      setStatus(offer.status)
    }
  }, [open, offer])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>Update the details for &quot;{offer.title}&quot;.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="offerType" value={offerType} />
          <input type="hidden" name="discountType" value={discountType} />
          <input type="hidden" name="status" value={status} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-offer-title">Offer Title *</Label>
              <Input
                id="edit-offer-title"
                name="title"
                defaultValue={offer.title}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-offer-type">Offer Type *</Label>
              <Select value={offerType} onValueChange={setOfferType}>
                <SelectTrigger id="edit-offer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-offer-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="edit-offer-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-discount-type">Discount Type *</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger id="edit-discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-discount-value">
                Discount Value * {discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="edit-discount-value"
                name="discountValue"
                type="number"
                min="0"
                max={discountType === "percentage" ? "100" : undefined}
                step="0.01"
                defaultValue={offer.discountValue}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-coupon-code">Coupon Code</Label>
              <Input
                id="edit-coupon-code"
                name="couponCode"
                defaultValue={offer.couponCode ?? ""}
                disabled={isPending}
                className="uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-usage-limit">Usage Limit</Label>
              <Input
                id="edit-usage-limit"
                name="usageLimit"
                type="number"
                min="1"
                defaultValue={offer.usageLimit ?? ""}
                placeholder="Leave empty for unlimited"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-min-purchase">Min Purchase Amount (₹)</Label>
              <Input
                id="edit-min-purchase"
                name="minPurchaseAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={offer.minPurchaseAmount ?? ""}
                placeholder="Optional"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-max-discount">Max Discount Amount (₹)</Label>
              <Input
                id="edit-max-discount"
                name="maxDiscountAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={offer.maxDiscountAmount ?? ""}
                placeholder="Optional cap"
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-start-date">Start Date *</Label>
              <Input
                id="edit-start-date"
                name="startDate"
                type="date"
                defaultValue={offer.startDate}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input
                id="edit-end-date"
                name="endDate"
                type="date"
                defaultValue={offer.endDate ?? ""}
                disabled={isPending}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-offer-description">Description</Label>
              <Textarea
                id="edit-offer-description"
                name="description"
                defaultValue={offer.description ?? ""}
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="edit-offer-notes">Internal Notes</Label>
              <Textarea
                id="edit-offer-notes"
                name="notes"
                defaultValue={offer.notes ?? ""}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
