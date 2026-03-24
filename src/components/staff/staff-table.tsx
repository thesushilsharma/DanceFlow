"use client";

import { useOptimistic, useTransition, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash, ArrowUpDown } from "lucide-react";
import { deleteStaff } from "@/app/actions/staff";
import { formatDate } from "@/lib/date";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  specializations: string[] | null;
  hireDate: string;
  status: string;
};

const roleColors = {
  Owner: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Instructor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Admin: "bg-green-500/10 text-green-700 dark:text-green-400",
  Assistant: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-leave": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

export function StaffTable({ initialStaff }: { initialStaff: Staff[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStaff, setOptimisticStaff] = useOptimistic(initialStaff);

  const handleDelete = (staffId: string) => {
    startTransition(async () => {
      setOptimisticStaff((staffList) => staffList.filter((s) => s.id !== staffId));
      await deleteStaff(staffId);
    });
  };

  const columns = useMemo<ColumnDef<Staff>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4 text-left font-medium"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={roleColors[row.original.role as keyof typeof roleColors]}
          >
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{row.original.email}</div>
            <div className="text-muted-foreground">{row.original.phone}</div>
          </div>
        ),
      },
      {
        accessorKey: "specializations",
        header: "Specializations",
        cell: ({ row }) => {
          const sp = row.original.specializations;
          return sp && sp.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {sp.map((spec: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        accessorKey: "hireDate",
        header: "Hire Date",
        cell: ({ row }) => (row.original.hireDate ? formatDate(row.original.hireDate, "SHORT") : "-"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={statusColors[row.original.status as keyof typeof statusColors]}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(staff.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [isPending, setOptimisticStaff]
  );

  return (
    <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
      <DataTable columns={columns} data={optimisticStaff} searchKey="name" />
    </div>
  );
}
