"use client";

import { Check, Plus, Search, Trash2 } from "lucide-react";
import type React from "react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getClasses } from "@/app/actions/classes";
import { createPayment } from "@/app/actions/finances";
import { getOffers, type Offer } from "@/app/actions/offers";
import { type ClassSession, getClassSessions } from "@/app/actions/sessions";
import { getStudents } from "@/app/actions/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ClassOption = {
  id: string;
  name: string;
  type: string;
  dayOfWeek: string;
  tuition: string | null;
};

type ClassLineItem = {
  key: string;
  classId: string;
  sessionId: string;
  offerId: string;
  amount: string;
};

const INITIAL_LINE_ITEM: ClassLineItem = {
  key: "line-1",
  classId: "",
  sessionId: "",
  offerId: "none",
  amount: "",
};

function parseAmount(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isNaN(amount) ? 0 : amount;
}

function calculateOfferDiscount(offer: Offer | undefined, amount: number) {
  if (!offer || amount <= 0) return 0;
  if (
    offer.minPurchaseAmount &&
    amount < Number.parseFloat(offer.minPurchaseAmount)
  )
    return 0;

  const rawDiscount =
    offer.discountType === "percentage"
      ? amount * (Number.parseFloat(offer.discountValue) / 100)
      : Number.parseFloat(offer.discountValue);
  const cappedDiscount = offer.maxDiscountAmount
    ? Math.min(rawDiscount, Number.parseFloat(offer.maxDiscountAmount))
    : rawDiscount;

  return Math.min(amount, Math.max(0, cappedDiscount));
}

export function AddPaymentDialog({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState("");
  const [state, formAction, isPending] = useActionState(createPayment, null);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
    }>
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    firstName: string;
    lastName: string;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [lineItems, setLineItems] = useState<ClassLineItem[]>([
    INITIAL_LINE_ITEM,
  ]);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [paymentStatus, setPaymentStatus] = useState("completed");
  const [sessionsByClassId, setSessionsByClassId] = useState<
    Record<string, ClassSession[]>
  >({});

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hasLoadedInitialRef = useRef(false);
  const lineIdRef = useRef(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.length > 0) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await getStudents(searchQuery);
        setStudents(results);
        setIsSearching(false);
      }, 300);
    } else {
      setStudents([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (open && !hasLoadedInitialRef.current && !searchQuery) {
      hasLoadedInitialRef.current = true;
      getStudents().then((results) => setStudents(results.slice(0, 10)));
      getClasses().then((results) => {
        setAvailableClasses(
          results.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            dayOfWeek: c.dayOfWeek,
            tuition: c.tuition,
          })),
        );
      });
      getOffers().then((results) =>
        setAvailableOffers(results.filter((o) => o.status === "active")),
      );
    }

    if (!open) hasLoadedInitialRef.current = false;
  }, [open, searchQuery]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedStudent(null);
      setStudents([]);
      setIsSearchOpen(false);
      setLineItems([INITIAL_LINE_ITEM]);
      lineIdRef.current = 1;
      setPaymentStatus("completed");
      setSessionsByClassId({});
      setPaymentDate("");
    } else {
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  const lineSummaries = useMemo(
    () =>
      lineItems.map((line) => {
        const amount = parseAmount(line.amount);
        const offer =
          line.offerId && line.offerId !== "none"
            ? availableOffers.find((o) => o.id === line.offerId)
            : undefined;
        const discountAmount = calculateOfferDiscount(offer, amount);
        return {
          ...line,
          parsedAmount: amount,
          selectedOffer: offer,
          discountAmount,
          finalAmount: Math.max(0, amount - discountAmount),
        };
      }),
    [lineItems, availableOffers],
  );

  const subtotal = lineSummaries.reduce(
    (sum, line) => sum + line.parsedAmount,
    0,
  );
  const calculatedDiscount = lineSummaries.reduce(
    (sum, line) => sum + line.discountAmount,
    0,
  );
  const finalAmount = lineSummaries.reduce(
    (sum, line) => sum + line.finalAmount,
    0,
  );

  const classLinesForSubmit = useMemo(
    () =>
      lineSummaries
        .filter((line) => line.classId && line.classId !== "none")
        .map((line) => ({
          classId: line.classId,
          sessionId: line.sessionId || null,
          offerId: line.offerId === "none" ? null : line.offerId,
          amount: line.parsedAmount,
          discountAmount: line.discountAmount,
        }))
        .filter((line) => line.amount > 0),
    [lineSummaries],
  );

  const hasDuplicateClasses =
    new Set(
      classLinesForSubmit.map(
        (line) => `${line.classId}:${line.sessionId ?? ""}`,
      ),
    ).size !== classLinesForSubmit.length;
  const multiClassMode = lineItems.length > 1;
  const canSubmit =
    !!selectedStudent &&
    subtotal > 0 &&
    !hasDuplicateClasses &&
    (!multiClassMode || classLinesForSubmit.length === lineItems.length);

  useEffect(() => {
    if (state?.success && open) {
      const enrolledCount = state.enrolledCount ?? classLinesForSubmit.length;
      if (enrolledCount > 1)
        toast.success(
          `Payment recorded and student enrolled in ${enrolledCount} classes`,
        );
      else if (enrolledCount === 1)
        toast.success("Payment recorded and student enrolled in class");
      else toast.success("Payment added successfully");
      setOpen(false);
      setSelectedStudent(null);
    } else if (state?.error && open) {
      toast.error(state.error);
    }
  }, [state, open, classLinesForSubmit.length]);

  function resolveTuition(classId: string, sessionId: string): string {
    const cls = availableClasses.find((c) => c.id === classId);
    if (sessionId) {
      const session = sessionsByClassId[classId]?.find(
        (s) => s.id === sessionId,
      );
      if (session?.tuitionFee) return session.tuitionFee;
    }
    return cls?.tuition ?? "";
  }

  async function handleClassChange(lineKey: string, classId: string) {
    const tuition = resolveTuition(classId, "");
    updateLineItem(lineKey, {
      classId,
      sessionId: "",
      offerId: "none",
      amount: tuition,
    });
    if (classId && !sessionsByClassId[classId]) {
      const sessions = await getClassSessions(classId);
      setSessionsByClassId((prev) => ({ ...prev, [classId]: sessions }));
    }
  }

  function handleSessionChange(
    lineKey: string,
    classId: string,
    sessionId: string,
  ) {
    const normalizedSessionId = sessionId === "none" ? "" : sessionId;
    const tuition = resolveTuition(classId, normalizedSessionId);
    updateLineItem(lineKey, {
      sessionId: normalizedSessionId,
      amount: tuition || lineItems.find((l) => l.key === lineKey)?.amount || "",
    });
  }

  function updateLineItem(
    key: string,
    patch: Partial<Omit<ClassLineItem, "key">>,
  ) {
    setLineItems((items) =>
      items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function addLineItem() {
    lineIdRef.current += 1;
    setLineItems((items) => [
      ...items,
      {
        key: `line-${lineIdRef.current}`,
        classId: "",
        sessionId: "",
        offerId: "none",
        amount: "",
      },
    ]);
  }

  function removeLineItem(key: string) {
    setLineItems((items) =>
      items.length <= 1 ? items : items.filter((item) => item.key !== key),
    );
  }

  if (!mounted) return children;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Record a payment from a student. Add another class when paying for
            multiple classes at once.
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
                      !selectedStudent && "text-muted-foreground",
                    )}
                  >
                    {selectedStudent
                      ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                      : "Search and select student..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
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
                        {searchQuery
                          ? "No students found"
                          : "Start typing to search"}
                      </div>
                    ) : (
                      <div className="p-1">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsSearchOpen(false);
                              setSearchQuery("");
                            }}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                              selectedStudent?.id === student.id && "bg-accent",
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent?.id === student.id
                                  ? "opacity-100"
                                  : "opacity-0",
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
                <input
                  type="hidden"
                  name="studentId"
                  value={selectedStudent.id}
                />
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

              {lineSummaries.map((line, index) => {
                const sessions = line.classId
                  ? (sessionsByClassId[line.classId] ?? [])
                  : [];
                return (
                  <div
                    key={line.key}
                    className="space-y-2 rounded-md border p-3"
                  >
                    <div className="grid gap-2 md:grid-cols-[minmax(150px,1.2fr)_minmax(120px,1fr)_minmax(130px,1fr)_110px_40px] md:items-end">
                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Class
                          </Label>
                        )}
                        <Select
                          value={line.classId || "none"}
                          onValueChange={(value) =>
                            handleClassChange(
                              line.key,
                              value === "none" ? "" : value,
                            )
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                multiClassMode
                                  ? "Select class *"
                                  : "Select class"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {!multiClassMode && (
                              <SelectItem value="none">None</SelectItem>
                            )}
                            {availableClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls.dayOfWeek})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Session
                          </Label>
                        )}
                        <Select
                          value={line.sessionId || "none"}
                          onValueChange={(value) =>
                            handleSessionChange(line.key, line.classId, value)
                          }
                          disabled={
                            isPending || !line.classId || sessions.length === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Session" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No session</SelectItem>
                            {sessions.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {session.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Offer
                          </Label>
                        )}
                        <Select
                          value={line.offerId}
                          onValueChange={(value) =>
                            updateLineItem(line.key, { offerId: value })
                          }
                          disabled={isPending || !line.classId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Offer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No offer</SelectItem>
                            {availableOffers.map((offer) => (
                              <SelectItem key={offer.id} value={offer.id}>
                                {offer.title} (
                                {offer.discountType === "percentage"
                                  ? `${offer.discountValue}%`
                                  : `$${offer.discountValue}`}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        {index === 0 && (
                          <Label className="text-xs text-muted-foreground">
                            Amount *
                          </Label>
                        )}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="120.00"
                          required
                          disabled={isPending}
                          value={line.amount}
                          onChange={(e) =>
                            updateLineItem(line.key, { amount: e.target.value })
                          }
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
                    {line.discountAmount > 0 && (
                      <p className="text-xs text-green-600">
                        {line.selectedOffer?.title}: -$
                        {line.discountAmount.toFixed(2)} on this class
                      </p>
                    )}
                  </div>
                );
              })}

              {hasDuplicateClasses && (
                <p className="text-sm text-destructive">
                  Each class/session can only be selected once.
                </p>
              )}
              {multiClassMode &&
                classLinesForSubmit.length < lineItems.length && (
                  <p className="text-sm text-destructive">
                    Select a class and amount for every line when paying for
                    multiple classes.
                  </p>
                )}
            </div>

            {(calculatedDiscount > 0 || classLinesForSubmit.length > 1) &&
              subtotal > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {calculatedDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${calculatedDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Total payment:</span>
                    <span>${finalAmount.toFixed(2)}</span>
                  </div>
                  {classLinesForSubmit.length > 1 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      One grouped receipt will be split into class-level payment
                      rows.
                    </p>
                  )}
                </div>
              )}

            <input type="hidden" name="amount" value={finalAmount.toFixed(2)} />
            <input
              type="hidden"
              name="discountAmount"
              value={calculatedDiscount.toFixed(2)}
            />
            {classLinesForSubmit.length > 0 && (
              <input
                type="hidden"
                name="classLineItems"
                value={JSON.stringify(classLinesForSubmit)}
              />
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={paymentStatus}
                  onValueChange={setPaymentStatus}
                >
                  <SelectTrigger id="status" disabled={isPending}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
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
  );
}
