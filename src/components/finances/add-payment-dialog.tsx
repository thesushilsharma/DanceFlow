"use client"

import type React from "react"
import { useState, useEffect, useRef, useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getStudents } from "@/app/actions/students"
import { getClasses } from "@/app/actions/classes"
import { createPayment } from "@/app/actions/finances"
import { toast } from "sonner"
import { Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ClassOption = {
  id: string
  name: string
  type: string
  dayOfWeek: string
}

export function AddPaymentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createPayment, null)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; email: string | null }>>([])
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; firstName: string; lastName: string } | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const hasLoadedInitialRef = useRef(false)

  // Debounced search for students
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length > 0) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await getStudents(searchQuery)
        setStudents(results)
        setIsSearching(false)
      }, 300)
    } else {
      setStudents([])
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Load initial students and classes when dialog opens
  useEffect(() => {
    if (open && !hasLoadedInitialRef.current && !searchQuery) {
      hasLoadedInitialRef.current = true
      getStudents().then((results) => {
        setStudents(results.slice(0, 10))
      })
      getClasses().then((results) => {
        setAvailableClasses(
          results.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            dayOfWeek: c.dayOfWeek,
          }))
        )
      })
    }

    if (!open) {
      hasLoadedInitialRef.current = false
    }
  }, [open, searchQuery])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSelectedStudent(null)
      setStudents([])
      setIsSearchOpen(false)
      setSelectedClassId("")
    }
  }, [open])

  // Handle success/error states
  useEffect(() => {
    if (state?.success && open) {
      toast.success("Payment added successfully")
      setOpen(false)
      setSelectedStudent(null)
    } else if (state?.error && open) {
      toast.error(state.error)
    }
  }, [state, open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>Record a new payment from a student.</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            {/* Student selector */}
            <div className="space-y-2">
              <Label htmlFor="student">Student *</Label>
              <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !selectedStudent && "text-muted-foreground"
                    )}
                  >
                    {selectedStudent
                      ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                      : "Search and select student..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 focus-ring-0"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[300px] overflow-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? "No students found" : "Start typing to search"}
                      </div>
                    ) : (
                      <div className="p-1">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student)
                              setIsSearchOpen(false)
                              setSearchQuery("")
                            }}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              selectedStudent?.id === student.id && "bg-accent"
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent?.id === student.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>
                                {student.firstName} {student.lastName}
                              </span>
                              {student.email && (
                                <span className="text-xs text-muted-foreground">
                                  {student.email}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedStudent && (
                <input type="hidden" name="studentId" value={selectedStudent.id} />
              )}
            </div>

            {/* Class selector */}
            <div className="space-y-2">
              <Label htmlFor="classId">Class (Payment For)</Label>
              <Select
                name="classId"
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={isPending}
              >
                <SelectTrigger id="classId">
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({cls.dayOfWeek})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Pass empty string if "none" selected so the action receives null */}
              {selectedClassId && selectedClassId !== "none" && (
                <input type="hidden" name="classId" value={selectedClassId} />
              )}
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="120.00"
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Date *</Label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Receipt Number & Reference Number */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  placeholder="RCP-0001"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  name="referenceNumber"
                  placeholder="Optional"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Payment Method & Payment Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger id="paymentMethod" disabled={isPending}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="debit-card">Debit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select name="paymentType" required>
                  <SelectTrigger id="paymentType" disabled={isPending}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition</SelectItem>
                    <SelectItem value="renewal">Renewal (Existing)</SelectItem>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="costume">Costume</SelectItem>
                    <SelectItem value="competition">Competition</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Optional notes..."
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedStudent}>
              {isPending ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
