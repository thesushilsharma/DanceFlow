"use client"

import { useOptimistic, useMemo } from "react"
import { formatDate } from "@/lib/date"
import { calculateVat } from "@/lib/vat"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface Expense {
  id: string
  category: string
  description: string
  amount: string
  netAmount: string | null
  vatAmount: string | null
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

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: "category",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Category
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.original.category}</span>,
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => row.original.description,
      },
      {
        accessorKey: "amount",
        header: "Total Amount",
        cell: ({ row }) => `$${Number.parseFloat(row.original.amount).toFixed(2)}`,
      },
      {
        accessorKey: "netAmount",
        header: "Net Amount",
        cell: ({ row }) => {
          if (row.original.netAmount) return `$${Number.parseFloat(row.original.netAmount).toFixed(2)}`
          const { netAmount } = calculateVat(Number.parseFloat(row.original.amount), 5, true)
          return `$${netAmount.toFixed(2)}`
        },
      },
      {
        accessorKey: "vatAmount",
        header: "VAT",
        cell: ({ row }) => {
          if (row.original.vatAmount) return `$${Number.parseFloat(row.original.vatAmount).toFixed(2)}`
          const { vatAmount } = calculateVat(Number.parseFloat(row.original.amount), 5, true)
          return `$${vatAmount.toFixed(2)}`
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (row.original.date ? formatDate(row.original.date, "SHORT") : "-"),
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        cell: ({ row }) => row.original.vendor || "-",
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => row.original.paymentMethod || "-",
      },
    ],
    []
  )

  return (
    <div className="border rounded-lg border-none shadow-none">
      <DataTable columns={columns} data={optimisticExpenses} searchKey="category" />
    </div>
  )
}
