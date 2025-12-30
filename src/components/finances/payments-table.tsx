"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useOptimistic } from "react"

interface Payment {
  id: string
  studentFirstName: string | null
  studentLastName: string | null
  amount: string
  paidDate: string | null
  dueDate: string
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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {payment.studentFirstName && payment.studentLastName
                  ? `${payment.studentFirstName} ${payment.studentLastName}`
                  : "Unknown Student"}
              </TableCell>
              <TableCell>${Number.parseFloat(payment.amount).toFixed(2)}</TableCell>
              <TableCell>{payment.dueDate || "N/A"}</TableCell>
              <TableCell>{payment.paidDate || "-"}</TableCell>
              <TableCell>{payment.method || "-"}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[payment.status]}>
                  {payment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
