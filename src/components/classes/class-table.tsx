"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreHorizontal, Users, Edit, Trash } from "lucide-react";
import { deleteClass } from "@/app/actions/classes";
import { useTransition } from "react";
import { toast } from "sonner";

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead>Tuition</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground py-8"
              >
                No classes found. Add your first class to get started.
              </TableCell>
            </TableRow>
          ) : (
            classes.map((classItem) => {
              const enrollmentPercentage =
                (classItem.enrollmentCount / classItem.capacity) * 100;
              const isNearCapacity = enrollmentPercentage >= 80;

              return (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">
                    {classItem.name}
                  </TableCell>
                  <TableCell>{classItem.type}</TableCell>
                  <TableCell>{classItem.level || "N/A"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="capitalize">{classItem.dayOfWeek}</div>
                      <div className="text-muted-foreground">
                        {classItem.startTime} - {classItem.endTime}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {classItem.instructorFirstName &&
                    classItem.instructorLastName
                      ? `${classItem.instructorFirstName} ${classItem.instructorLastName}`
                      : "Not assigned"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isNearCapacity
                            ? "text-yellow-600 dark:text-yellow-400"
                            : ""
                        }
                      >
                        {classItem.enrollmentCount}/{classItem.capacity}
                      </span>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>${classItem.tuition ?? "0.00"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        statusColors[
                          classItem.status as keyof typeof statusColors
                        ]
                      }
                    >
                      {classItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                        >
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
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
