import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react"
import { PaymentsTable } from "@/components/finances/payments-table"
import { ExpensesTable } from "@/components/finances/expenses-table"
import { AddPaymentDialog } from "@/components/finances/add-payment-dialog"
import { AddExpenseDialog } from "@/components/finances/add-expense-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getPayments, getExpenses } from "@/app/actions/finances"

export default async function FinancesPage() {
  const [payments, expenses] = await Promise.all([getPayments(), getExpenses()])

  const totalRevenue = payments.reduce((sum: number, p) => sum + Number.parseFloat(p.amount), 0)
  const totalExpenses = expenses.reduce((sum: number, e) => sum + Number.parseFloat(e.amount), 0)
  const netProfit = totalRevenue - totalExpenses
  const outstanding = payments
    .filter((p) => p.status === "pending")
    .reduce((sum: number, p) => sum + Number.parseFloat(p.amount), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finances</h1>
        <p className="text-muted-foreground mt-1">Track payments, expenses, and financial reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${netProfit.toFixed(2)}</div>
            <p
              className={`text-xs mt-1 ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {netProfit >= 0 ? "Profit" : "Loss"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${outstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <AddPaymentDialog>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </AddPaymentDialog>
            <AddExpenseDialog>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </AddExpenseDialog>
          </div>
        </div>

        <TabsContent value="payments">
          <PaymentsTable initialPayments={payments} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTable initialExpenses={expenses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}