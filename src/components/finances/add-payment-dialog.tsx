"use client"

import type React from "react"
import { useState, useEffect, useRef, useActionState, useMemo } from "react"
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
import { getClassSessions, type ClassSession } from "@/app/actions/sessions"
import { getOffers, type Offer } from "@/app/actions/offers"
import { createPayment } from "@/app/actions/finances"
import { toast } from "sonner"
import { Search, Check, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ClassOption = {
  id: string
  name: string
  type: string
  dayOfWeek: string
  tuition: string | null
}

type ClassLineItem = {
  key: string
  classId: string
  sessionId: string
  amount: string
}

const INITIAL_LINE_ITEM: ClassLineItem = { key: "line-1", classId: "", sessionId: "", amount: "" }

export function AddPaymentDialog({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [paymentDate, setPaymentDate] = useState("")
  const [state, formAction, isPending] = useActionState(createPayment, null)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Array<{ id: string; firstName: string; lastName: string; email: string | null }>>([])
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; firstName: string; lastName: string } | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([])
  const [lineItems, setLineItems] = useState<ClassLineItem[]>([INITIAL_LINE_ITEM])
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState<string>("none")
  const [paymentStatus, setPaymentStatus] = useState("completed")
  const [sessionsByClassId, setSessionsByClassId] = useState<Record<string, ClassSession[]>>({})

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const hasLoadedInitialRef = useRef(false)
  const lineIdRef = useRef(1)

  useEffect(() => {
    setMounted(true)
  }, [])

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
            tuition: c.tuition,
          }))
        )
      })
      getOffers().then((results) => {
        setAvailableOffers(results.filter((o) => o.status === "active"))
      })
    }

    if (!open) {
      hasLoadedInitialRef.current = false
    }
  }, [open, searchQuery])

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSelectedStudent(null)
      setStudents([])
      setIsSearchOpen(false)
      setLineItems([INITIAL_LINE_ITEM])
      lineIdRef.current = 1
      setSelectedOfferId("none")
      setPaymentStatus("completed")
      setSessionsByClassId({})
      setPaymentDate("")
    } else {
      setPaymentDate(new Date().toISOString().split("T")[0])
    }
  }, [open])

  const subtotal = useMemo(
    () =>
      lineItems.reduce((sum, line) => {
        const value = parseFloat(line.amount)
        return sum + (isNaN(value) ? 0 : value)
      }, 0),
    [lineItems]
  )

  const selectedOffer = availableOffers.find((o) => o.id === selectedOfferId)
  let calculatedDiscount = 0
  if (selectedOffer && subtotal > 0) {
    if (selectedOffer.discountType === "percentage") {
      calculatedDiscount = subtotal * (parseFloat(selectedOffer.discountValue) / 100)
      if (selectedOffer.maxDiscountAmount) {
        const max = parseFloat(selectedOffer.maxDiscountAmount)
        if (calculatedDiscount > max) calculatedDiscount = max
      }
    } else {
      calculatedDiscount = parseFloat(selectedOffer.discountValue)
    }
  }
  const finalAmount = subtotal > 0 ? Math.max(0, subtotal - calculatedDiscount) : 0

  const classLinesForSubmit = useMemo(
    () =>
      lineItems
        .filter((line) => line.classId && line.classId !== "none")
        .map((line) => ({
          classId: line.classId,
          sessionId: line.sessionId || null,
          amount: parseFloat(line.amount) || 0,
        }))
        .filter((line) => line.amount > 0),
    [lineItems]
  )

  const hasDuplicateClasses =
    new Set(classLinesForSubmit.map((line) => `${line.classId}:${line.sessionId ?? ""}`)).size !==
    classLinesForSubmit.length

  const multiClassMode = lineItems.length > 1
  const canSubmit =
    !!selectedStudent &&
    subtotal > 0 &&
    !hasDuplicateClasses &&
    (!multiClassMode || classLinesForSubmit.length === lineItems.length)

  useEffect(() => {
    if (state?.success && open) {
      const enrolledCount = state.enrolledCount ?? classLinesForSubmit.length
      if (enrolledCount > 1) {
        toast.success(`Payment recorded and student enrolled in ${enrolledCount} classes`)
      } else if (enrolledCount === 1) {
        toast.success("Payment recorded and student enrolled in class")
      } else {
        toast.success("Payment added successfully")
      }
      setOpen(false)
      setSelectedStudent(null)
    } else if (state?.error && open) {
      toast.error(state.error)
    }
  }, [state, open, classLinesForSubmit.length])

  function resolveTuition(classId: string, sessionId: string): string {
    const cls = availableClasses.find((c) => c.id === classId)
    if (sessionId) {
      const session = sessionsByClassId[classId]?.find((s) => s.id === sessionId)
      if (session?.tuitionFee) return session.tuitionFee
    }
    return cls?.tuition ?? ""
  }

  async function handleClassChange(lineKey: string, classId: string) {
    updateLineItem(lineKey, { classId, sessionId: "", amount: "" })
    if (!classId) return

    if (!sessionsByClassId[classId]) {
      const sessions = await getClassSessions(classId)
      setSessionsByClassId((prev) => ({ ...prev, [classId]: sessions }))
    }

    const tuition = resolveTuition(classId, "")
    if (tuition) updateLineItem(lineKey, { classId, sessionId: "", amount: tuition })
  }

  function handleSessionChange(lineKey: string, classId: string, sessionId: string) {
    const tuition = resolveTuition(classId, sessionId === "none" ? "" : sessionId)
    updateLineItem(lineKey, {
      sessionId: sessionId === "none" ? "" : sessionId,
      amount: tuition || lineItems.find((l) => l.key === lineKey)?.amount || "",
    })
  }

  function updateLineItem(
    key: string,
    patch: Partial<Pick<ClassLineItem, "classId" | "sessionId" | "amount">>
  ) {
    setLineItems((items) => items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  function addLineItem() {
    lineIdRef.current += 1
    setLineItems((items) => [
      ...items,
      { key: `line-${lineIdRef.current}`, classId: "", sessionId: "", amount: "" },
    ])
  }

  function removeLineItem(key: string) {
    setLineItems((items) => (items.length <= 1 ? items : items.filter((item) => item.key !== key)))
  }

  if (!mounted) {
    return children
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment from a student. Add another class when paying for multiple classes at once.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Classes (Payment For)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={addLineItem}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add class
                </Button>
              </div>

              {lineItems.map((line, index) => {
                const sessions = line.classId ? sessionsByClassId[line.classId] ?? [] : []
                return (
                <motion.div key={line.key} className="space-y-2 rounded-md border p-3">
                <div className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
                  <div className="space-y-1">
                    {index === 0 && (
                      <Label className="text-xs text-muted-foreground">Class</Label>
                    )}
                    <Select
                      value={line.classId || "none"}
                      onValueChange={(value) =>
                        handleClassChange(line.key, value === "none" ? "" : value)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={multiClassMode ? "Select class *" : "Select class (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {!multiClassMode && <SelectItem value="none">— None —</SelectItem>}
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
                  </div>
                  <div className="space-y-1">
                    {index === 0 && (
                      <Label className="text-xs text-muted-foreground">Amount *</Label>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="120.00"
                      required
                      disabled={isPending}
                      value={line.amount}
                      onChange={(e) => updateLineItem(line.key, { amount: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeLineItem(line.key)}
                    disabled={isPending || lineItems.length <= 1}
                    aria-label="Remove class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {hasDuplicateClasses && (
                <p className="text-sm text-destructive">Each class can only be selected once.</p>
              )}
              {multiClassMode && classLinesForSubmit.length < lineItems.length && (
                <p className="text-sm text-destructive">
                  Select a class and amount for every line when paying for multiple classes.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offerId">Apply Offer</Label>
                <Select
                  value={selectedOfferId}
                  onValueChange={setSelectedOfferId}
                  disabled={isPending}
                >
                  <SelectTrigger id="offerId">
                    <SelectValue placeholder="Select offer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {availableOffers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.title} ({offer.discountType === "percentage" ? `${offer.discountValue}% off` : `$${offer.discountValue} off`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedOfferId !== "none" || classLinesForSubmit.length > 1) && subtotal > 0 && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {selectedOfferId !== "none" && calculatedDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({selectedOffer?.title}):</span>
                    <span>-${calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Total payment:</span>
                  <span>${finalAmount.toFixed(2)}</span>
                </div>
                {classLinesForSubmit.length > 1 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    One payment record per class; same receipt number links them.
                  </p>
                )}
              </div>
            )}

            <input type="hidden" name="amount" value={finalAmount.toFixed(2)} />
            {classLinesForSubmit.length > 0 && (
              <input type="hidden" name="classLineItems" value={JSON.stringify(classLinesForSubmit)} />
            )}
            {selectedOfferId !== "none" && (
              <>
                <input type="hidden" name="offerId" value={selectedOfferId} />
                <input type="hidden" name="discountAmount" value={calculatedDiscount.toFixed(2)} />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Date *</Label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

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
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? "Adding..." : "Add Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
