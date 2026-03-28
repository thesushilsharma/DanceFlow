"use client"

import { useOptimistic, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/date"
import { calculateVat } from "@/lib/vat"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

interface Payment {
  id: string
  studentFirstName: string | null
  studentLastName: string | null
  amount: string
  netAmount: string | null
  vatAmount: string | null
  paidDate: string | null
  method: string | null
  status: "paid" | "pending" | "overdue" | "cancelled"
  notes: string | null
}

const statusColors = {
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

export function PaymentsTable({ initialPayments }: { initialPayments: Payment[] }) {
  const [optimisticPayments] = useOptimistic(initialPayments)

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "student",
        accessorFn: (row) =>
          row.studentFirstName && row.studentLastName
            ? `${row.studentFirstName} ${row.studentLastName}`
            : "Unknown Student",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Student
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.getValue("student")}</span>,
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
        accessorKey: "paidDate",
        header: "Paid Date",
        cell: ({ row }) => (row.original.paidDate ? formatDate(row.original.paidDate, "SHORT") : "-"),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => row.original.method || "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="secondary" className={statusColors[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  )

  return (
    <div className="border rounded-lg border-none shadow-none">
      <DataTable columns={columns} data={optimisticPayments} searchKey="student" />
    </div>
  )
}
