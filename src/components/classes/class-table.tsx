"use client";

import { useTransition, useMemo } from "react";
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
import { MoreHorizontal, Users, Edit, Trash, ArrowUpDown } from "lucide-react";
import { deleteClass } from "@/app/actions/classes";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

type ClassWithDetails = {
  id: string;
  name: string;
  type: string;
  level: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  capacity: number;
  tuition: string | null;
  status: string;
  instructorFirstName: string | null;
  instructorLastName: string | null;
  enrollmentCount: number;
};

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  full: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function ClassTable({ classes }: { classes: ClassWithDetails[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    startTransition(async () => {
      const result = await deleteClass(id);
      if (result.success) {
        toast.success("Class deleted successfully");
      } else {
        toast.error(result.error);
      }
    });
  };

  const columns = useMemo<ColumnDef<ClassWithDetails>[]>(
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
              Class Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ row }) => row.original.level || "N/A",
      },
      {
        id: "schedule",
        header: "Schedule",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="capitalize">{row.original.dayOfWeek}</div>
            <div className="text-muted-foreground">
              {row.original.startTime} - {row.original.endTime}
            </div>
          </div>
        ),
      },
      {
        id: "instructor",
        header: "Instructor",
        cell: ({ row }) =>
          row.original.instructorFirstName && row.original.instructorLastName
            ? `${row.original.instructorFirstName} ${row.original.instructorLastName}`
            : "Not assigned",
      },
      {
        id: "enrollment",
        header: "Enrollment",
        cell: ({ row }) => {
          const classItem = row.original;
          const enrollmentPercentage = (classItem.enrollmentCount / classItem.capacity) * 100;
          const isNearCapacity = enrollmentPercentage >= 80;
          return (
            <div className="flex items-center gap-2">
              <span className={isNearCapacity ? "text-yellow-600 dark:text-yellow-400" : ""}>
                {classItem.enrollmentCount}/{classItem.capacity}
              </span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        },
      },
      {
        accessorKey: "tuition",
        header: "Tuition",
        cell: ({ row }) => `$${row.original.tuition ?? "0.00"}`,
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
          const classItem = row.original;
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
                  <Users className="h-4 w-4 mr-2" />
                  Manage Enrollments
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDelete(classItem.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [isPending]
  );

  return (
    <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
      <div className="border rounded-lg border-none shadow-none">
        <DataTable columns={columns} data={classes} searchKey="name" />
      </div>
    </div>
  );
}
