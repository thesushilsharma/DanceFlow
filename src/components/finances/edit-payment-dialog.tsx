"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updatePaymentGroup } from "@/app/actions/finances";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentGroup } from "@/lib/group-payments";

export function EditPaymentDialog({
  group,
  open,
  onOpenChange,
}: {
  group: PaymentGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updatePaymentGroup,
    null,
  );

  useEffect(() => {
    if (state?.success && open) {
      toast.success("Payment updated");
      onOpenChange(false);
    } else if (state?.error && open) {
      toast.error(state.error);
    }
  }, [state, open, onOpenChange]);

  const statusValue =
    group.rawStatus === "completed" ? "completed" : group.rawStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit payment</DialogTitle>
          <DialogDescription>
            {group.classLabel} — ${group.totalAmount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="groupKey" value={group.groupKey} />
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select name="status" defaultValue={statusValue}>
                <SelectTrigger id="edit-status" disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed / Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  name="paymentDate"
                  type="date"
                  required
                  defaultValue={group.paidDate ?? ""}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-method">Method</Label>
                <Select
                  name="paymentMethod"
                  defaultValue={group.method ?? undefined}
                >
                  <SelectTrigger id="edit-method" disabled={isPending}>
                    <SelectValue placeholder="Method" />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-receipt">Receipt</Label>
                <Input
                  id="edit-receipt"
                  name="receiptNumber"
                  defaultValue={group.receiptNumber ?? ""}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference</Label>
                <Input
                  id="edit-reference"
                  name="referenceNumber"
                  defaultValue={group.referenceNumber ?? ""}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Payment type</Label>
              <Select
                name="paymentType"
                defaultValue={group.paymentType ?? undefined}
              >
                <SelectTrigger id="edit-type" disabled={isPending}>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tuition">Tuition</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="costume">Costume</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                name="notes"
                defaultValue={group.notes ?? ""}
                disabled={isPending}
              />
            </div>

            {group.lineItems.length > 1 && (
              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <p className="font-medium">
                  Line items (amounts not editable here)
                </p>
                {group.lineItems.map((line) => (
                  <p key={line.paymentId}>
                    {line.className}
                    {line.sessionName ? ` (${line.sessionName})` : ""}: $
                    {Number.parseFloat(line.amount).toFixed(2)}
                  </p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
