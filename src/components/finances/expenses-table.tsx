"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOptimistic } from "react"
import { Badge } from "../ui/badge"

interface Expense {
  id: string
  category: string
  description: string
  amount: string
  date: string
  vendor: string | null
  paymentMethod: string | null
  notes: string | null
}

const statusColors = {
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  reimbursed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

export function ExpensesTable({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [optimisticExpenses] = useOptimistic(initialExpenses)

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Payment Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.category}</TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>${Number.parseFloat(expense.amount).toFixed(2)}</TableCell>
              <TableCell>{expense.date}</TableCell>
              <TableCell>{expense.vendor || "-"}</TableCell>
              <TableCell>{expense.paymentMethod || "-"}</TableCell>
              <TableCell>
                {/* <Badge variant="secondary" className={statusColors[expense.status as keyof typeof statusColors]}>
                  {expense.status}
                </Badge> */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
