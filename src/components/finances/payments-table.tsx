"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { completePaymentGroup, voidPaymentGroup } from "@/app/actions/finances";
import { EditPaymentDialog } from "@/components/finances/edit-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/date";
import type { PaymentGroup } from "@/lib/group-payments";

const statusColors: Record<string, string> = {
  paid: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-400",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  refunded: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function PaymentGroupActions({ group }: { group: PaymentGroup }) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const isPendingPayment = group.rawStatus === "pending";
  const canVoid =
    group.rawStatus !== "refunded" && group.rawStatus !== "cancelled";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label="Payment actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          {isPendingPayment && (
            <DropdownMenuItem
              onClick={() =>
                startTransition(async () => {
                  const result = await completePaymentGroup(group.groupKey);
                  if (result?.success)
                    toast.success("Payment marked as collected");
                  else
                    toast.error(result?.error ?? "Failed to collect payment");
                })
              }
            >
              Mark collected
            </DropdownMenuItem>
          )}
          {canVoid && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  startTransition(async () => {
                    const result = await voidPaymentGroup(group.groupKey);
                    if (result?.success) toast.success("Payment voided");
                    else toast.error(result?.error ?? "Failed to void payment");
                  })
                }
              >
                Void / refund
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <EditPaymentDialog
        group={group}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

export function PaymentsTable({
  initialGroups,
}: {
  initialGroups: PaymentGroup[];
}) {
  const columns = useMemo<ColumnDef<PaymentGroup>[]>(
    () => [
      {
        id: "student",
        accessorFn: (row) =>
          row.studentFirstName && row.studentLastName
            ? `${row.studentFirstName} ${row.studentLastName}`
            : "Unknown Student",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 text-left font-medium"
          >
            Student
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("student")}</span>
        ),
      },
      {
        accessorKey: "classLabel",
        header: "Class(es)",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <span className="line-clamp-2">{row.original.classLabel}</span>
            {row.original.isGrouped && (
              <span className="text-xs text-muted-foreground block">
                {row.original.lineItems.length} classes
              </span>
            )}
          </div>
        ),
      },
      {
        id: "totalAmount",
        accessorFn: (row) => row.totalAmount,
        header: "Amount",
        cell: ({ row }) => `$${row.original.totalAmount.toFixed(2)}`,
      },
      {
        accessorKey: "paidDate",
        header: "Paid Date",
        cell: ({ row }) =>
          row.original.paidDate
            ? formatDate(row.original.paidDate, "SHORT")
            : "-",
      },
      {
        accessorKey: "receiptNumber",
        header: "Receipt",
        cell: ({ row }) => row.original.receiptNumber ?? "—",
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => row.original.method ?? "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              statusColors[row.original.status] ?? statusColors.pending
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <PaymentGroupActions group={row.original} />,
      },
    ],
    [],
  );

  return (
    <div className="border rounded-lg border-none shadow-none">
      <DataTable columns={columns} data={initialGroups} searchKey="student" />
    </div>
  );
}
