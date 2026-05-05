"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteOffer, toggleOfferStatus, type Offer } from "@/app/actions/offers"
import { EditOfferDialog } from "./edit-offer-dialog"
import {
  Percent,
  IndianRupee,
  Tag,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Copy,
  CheckCheck,
  Users,
  Sparkles,
  Leaf,
  Link2,
  GraduationCap,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"

const OFFER_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  festive:  { label: "Festive",  icon: Sparkles,     color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  staff:    { label: "Staff",    icon: Users,         color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/40" },
  season:   { label: "Season",   icon: Leaf,          color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-950/40" },
  referral: { label: "Referral", icon: Link2,         color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-950/40" },
  student:  { label: "Student",  icon: GraduationCap, color: "text-cyan-600 dark:text-cyan-400",   bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  flash:    { label: "Flash",    icon: Zap,           color: "text-yellow-600 dark:text-yellow-400",bg: "bg-yellow-50 dark:bg-yellow-950/40" },
  other:    { label: "Other",    icon: Tag,           color: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-50 dark:bg-slate-900/40" },
}

const STATUS_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:    { label: "Active",    variant: "default" },
  scheduled: { label: "Scheduled", variant: "secondary" },
  inactive:  { label: "Inactive",  variant: "outline" },
  expired:   { label: "Expired",   variant: "destructive" },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function isExpired(endDate: string | null) {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

interface OfferCardProps {
  offer: Offer
}

function OfferCard({ offer }: OfferCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const meta = OFFER_TYPE_META[offer.offerType] ?? OFFER_TYPE_META.other
  const TypeIcon = meta.icon

  const effectiveStatus = isExpired(offer.endDate) ? "expired" : offer.status
  const statusMeta = STATUS_META[effectiveStatus] ?? STATUS_META.inactive

  const handleCopyCoupon = () => {
    if (offer.couponCode) {
      navigator.clipboard.writeText(offer.couponCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggle = () => {
    startTransition(async () => {
      await toggleOfferStatus(offer.id, offer.status)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOffer(offer.id)
      router.refresh()
    })
  }

  return (
    <>
      <Card className={`flex flex-col overflow-hidden transition-shadow hover:shadow-md ${isPending ? "opacity-60" : ""}`}>
        {/* Coloured type banner */}
        <div className={`px-4 py-2.5 flex items-center justify-between ${meta.bg}`}>
          <div className={`flex items-center gap-1.5 font-semibold text-sm ${meta.color}`}>
            <TypeIcon className="h-4 w-4" />
            {meta.label} Offer
          </div>
          <Badge variant={statusMeta.variant} className="text-xs capitalize">
            {statusMeta.label}
          </Badge>
        </div>

        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-snug line-clamp-2">{offer.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleToggle} disabled={isPending}>
                  {offer.status === "active" ? (
                    <><ToggleLeft className="h-4 w-4 mr-2" />Deactivate</>
                  ) : (
                    <><ToggleRight className="h-4 w-4 mr-2" />Activate</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400 focus:text-red-600"
                  onSelect={() => setDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {offer.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{offer.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Discount badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-bold">
              {offer.discountType === "percentage" ? (
                <><Percent className="h-3.5 w-3.5" />{offer.discountValue}% OFF</>
              ) : (
                <><IndianRupee className="h-3.5 w-3.5" />{Number(offer.discountValue).toLocaleString("en-IN")} OFF</>
              )}
            </div>
            {offer.maxDiscountAmount && offer.discountType === "percentage" && (
              <span className="text-xs text-muted-foreground">
                up to ₹{Number(offer.maxDiscountAmount).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Coupon code */}
          {offer.couponCode && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted rounded-md px-2.5 py-1 font-mono text-sm font-semibold tracking-widest flex-1">
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {offer.couponCode}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyCoupon}>
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatDate(offer.startDate)}
              {offer.endDate ? ` → ${formatDate(offer.endDate)}` : " (No expiry)"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0 pb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {offer.minPurchaseAmount
              ? `Min. ₹${Number(offer.minPurchaseAmount).toLocaleString("en-IN")}`
              : "No min. purchase"}
          </span>
          {offer.usageLimit ? (
            <span>
              {offer.usageCount ?? 0}/{offer.usageLimit} used
            </span>
          ) : (
            <span>Unlimited uses</span>
          )}
        </CardFooter>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{offer.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <EditOfferDialog 
        offer={offer} 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
      />
    </>
  )
}

interface OffersGridProps {
  initialOffers: Offer[]
}

export function OffersGrid({ initialOffers }: OffersGridProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = initialOffers.filter((o) => {
    const matchSearch =
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.couponCode?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (o.description?.toLowerCase().includes(search.toLowerCase()) ?? false)

    const effectiveStatus = isExpired(o.endDate) ? "expired" : o.status
    const matchType = typeFilter === "all" || o.offerType === typeFilter
    const matchStatus = statusFilter === "all" || effectiveStatus === statusFilter

    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="offers-search"
            placeholder="Search by title, code or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger id="offers-type-filter" className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(OFFER_TYPE_META).map(([v, m]) => (
              <SelectItem key={v} value={v}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="offers-status-filter" className="w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium text-muted-foreground">No offers found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {initialOffers.length === 0
              ? "Create your first offer to get started."
              : "Try adjusting the filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}
