import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Tag, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { AddOfferDialog } from "@/components/offers/add-offer-dialog"
import { OffersGrid } from "@/components/offers/offers-grid"
import { getOffers } from "@/app/actions/offers"

export default async function OffersPage() {
  const offers = await getOffers()

  const activeOffers = offers.filter((o) => {
    const isExpired = o.endDate && new Date(o.endDate) < new Date()
    return o.status === "active" && !isExpired
  })

  const scheduledOffers = offers.filter((o) => o.status === "scheduled")

  const expiredOffers = offers.filter((o) => {
    const isExpired = o.endDate && new Date(o.endDate) < new Date()
    return isExpired || o.status === "expired"
  })

  const totalUsage = offers.reduce((sum, o) => sum + (o.usageCount ?? 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Offers & Promotions</h1>
          <p className="text-muted-foreground mt-1">
            Manage festive offers, staff discounts, seasonal deals, and more
          </p>
        </div>
        <AddOfferDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeOffers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Running now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {scheduledOffers.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming offers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Offers grid with filters */}
      <OffersGrid initialOffers={offers} />
    </div>
  )
}
