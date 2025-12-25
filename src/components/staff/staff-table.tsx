"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash } from "lucide-react"
import { deleteStaff } from "@/app/actions/staff"
import { useOptimistic, useTransition } from "react"

type Staff = {
  id: number
  name: string
  email: string
  phone: string
  role: string
  specializations: string[]
  hireDate: string
  status: string
}

const roleColors = {
  Owner: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  Instructor: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  Admin: "bg-green-500/10 text-green-700 dark:text-green-400",
  Assistant: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  "on-leave": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
}

export function StaffTable({ initialStaff }: { initialStaff: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticStaff, setOptimisticStaff] = useOptimistic(initialStaff)

  const handleDelete = (staffId: number) => {
    startTransition(async () => {
      setOptimisticStaff(optimisticStaff.filter((s) => s.id !== staffId))
      await deleteStaff(staffId)
    })
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Specializations</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticStaff.map((staff) => (
            <TableRow key={staff.id} className={isPending ? "opacity-50" : ""}>
              <TableCell className="font-medium">{staff.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={roleColors[staff.role as keyof typeof roleColors]}>
                  {staff.role}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{staff.email}</div>
                  <div className="text-muted-foreground">{staff.phone}</div>
                </div>
              </TableCell>
              <TableCell>
                {staff.specializations && staff.specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {staff.specializations.map((spec: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>{staff.hireDate}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[staff.status as keyof typeof statusColors]}>
                  {staff.status}
                </Badge>
              </TableCell>
              <TableCell>
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
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(staff.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
