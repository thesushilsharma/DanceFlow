"use client";

import { useTransition, useMemo, useState, useCallback } from "react";
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
import { MoreHorizontal, Users, Edit, Trash, ArrowUpDown, Layers } from "lucide-react";
import { deleteClass } from "@/app/actions/classes";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { EditClassDialog } from "./edit-class-dialog";
import { ManageEnrollmentsDialog } from "./manage-enrollments-dialog";
import { SessionsDialog } from "./sessions-dialog";

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
  instructorId: string | null;
  enrollmentCount: number;
  description?: string | null;
};

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  full: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function ClassTable({ 
  classes,
  staff,
}: { 
  classes: ClassWithDetails[];
  staff: Array<{ id: string; firstName: string; lastName: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [enrollmentsDialogOpen, setEnrollmentsDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    startTransition(async () => {
      const result = await deleteClass(id);
      if (result.success) {
        toast.success("Class deleted successfully");
      } else {
        toast.error(result.error);
      }
    });
  }, []);

  const handleEdit = useCallback((classItem: ClassWithDetails) => {
    setSelectedClass(classItem);
    setEditDialogOpen(true);
  }, []);

  const handleManageEnrollments = useCallback((classItem: ClassWithDetails) => {
    setSelectedClass(classItem);
    setEnrollmentsDialogOpen(true);
  }, []);

  const handleSessions = useCallback((classItem: ClassWithDetails) => {
    setSelectedClass(classItem);
    setSessionsDialogOpen(true);
  }, []);

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
                <DropdownMenuItem onClick={() => handleSessions(classItem)}>
                  <Layers className="h-4 w-4 mr-2" />
                  Sessions / Batches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleManageEnrollments(classItem)}>
                  <Users className="h-4 w-4 mr-2" />
                  Legacy Enrollments
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(classItem)}>
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
    [isPending, handleDelete, handleEdit, handleManageEnrollments, handleSessions]
  );

  return (
    <>
      <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : ""}>
        <div className="border rounded-lg border-none shadow-none">
          <DataTable columns={columns} data={classes} searchKey="name" />
        </div>
      </div>

      {selectedClass && (
        <>
          <EditClassDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            classData={{
              id: selectedClass.id,
              name: selectedClass.name,
              type: selectedClass.type,
              level: selectedClass.level,
              dayOfWeek: selectedClass.dayOfWeek,
              startTime: selectedClass.startTime,
              endTime: selectedClass.endTime,
              room: selectedClass.room,
              capacity: selectedClass.capacity,
              tuition: selectedClass.tuition,
              status: selectedClass.status,
              description: selectedClass.description,
              instructorId: selectedClass.instructorId,
            }}
            staff={staff}
          />
          <ManageEnrollmentsDialog
            open={enrollmentsDialogOpen}
            onOpenChange={setEnrollmentsDialogOpen}
            classId={selectedClass.id}
            className={selectedClass.name}
            capacity={selectedClass.capacity}
          />
          <SessionsDialog
            open={sessionsDialogOpen}
            onOpenChange={setSessionsDialogOpen}
            classId={selectedClass.id}
            className={selectedClass.name}
            classCapacity={selectedClass.capacity}
          />
        </>
      )}
    </>
  );
}
