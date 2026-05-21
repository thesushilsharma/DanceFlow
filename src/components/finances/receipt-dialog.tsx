"use client";

import { Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentGroup } from "@/lib/group-payments";

function studentName(group: PaymentGroup) {
  return [group.studentFirstName, group.studentLastName]
    .filter(Boolean)
    .join(" ");
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function receiptLines(group: PaymentGroup) {
  return group.lineItems
    .map((line) => {
      const label = line.sessionName
        ? `${line.className ?? "General"} (${line.sessionName})`
        : (line.className ?? "General");
      const discount = Number.parseFloat(line.discountAmount ?? "0") || 0;
      const discountText = discount > 0 ? `, discount ${money(discount)}` : "";
      return `${label}: ${money(Number.parseFloat(line.amount) || 0)}${discountText}`;
    })
    .join("\n");
}

function receiptEmailHref(group: PaymentGroup) {
  const receiptNumber = group.receiptNumber ?? group.groupKey;
  const subject = `Receipt ${receiptNumber}`;
  const body = [
    `Receipt: ${receiptNumber}`,
    `Student: ${studentName(group) || "Student"}`,
    `Date: ${group.paidDate ?? ""}`,
    "",
    receiptLines(group),
    "",
    `Total: ${money(group.totalAmount)}`,
    `Status: ${group.status}`,
  ].join("\n");

  return `mailto:${group.studentEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildReceiptHtml(group: PaymentGroup) {
  const receiptNumber = group.receiptNumber ?? group.groupKey;
  const rows = group.lineItems
    .map((line) => {
      const label = line.sessionName
        ? `${line.className ?? "General"} (${line.sessionName})`
        : (line.className ?? "General");
      const discount = Number.parseFloat(line.discountAmount ?? "0") || 0;
      return `<tr>
        <td>${escapeHtml(label)}</td>
        <td>${discount > 0 ? money(discount) : "-"}</td>
        <td>${money(Number.parseFloat(line.amount) || 0)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <title>Receipt ${escapeHtml(receiptNumber)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
      .receipt { max-width: 720px; margin: 0 auto; }
      .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; }
      h1 { font-size: 24px; margin: 0 0 6px; }
      .muted { color: #6b7280; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 28px; }
      th, td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
      th:nth-child(2), th:nth-child(3), td:nth-child(2), td:nth-child(3) { text-align: right; }
      .total { display: flex; justify-content: flex-end; gap: 48px; margin-top: 20px; font-size: 18px; font-weight: 700; }
      @media print { button { display: none; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="top">
        <div>
          <h1>DanceFlow Receipt</h1>
          <div class="muted">Receipt ${escapeHtml(receiptNumber)}</div>
        </div>
        <div>
          <div><strong>${escapeHtml(studentName(group) || "Student")}</strong></div>
          <div class="muted">${escapeHtml(group.studentEmail ?? "")}</div>
          <div class="muted">${escapeHtml(group.paidDate ?? "")}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Class</th><th>Discount</th><th>Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total"><span>Total</span><span>${money(group.totalAmount)}</span></div>
      <p class="muted">Status: ${escapeHtml(group.status)}</p>
    </div>
    <script>window.print();</script>
  </body>
</html>`;
}

function printReceipt(group: PaymentGroup) {
  const receiptWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=860,height=900",
  );
  if (!receiptWindow) return;
  receiptWindow.document.write(buildReceiptHtml(group));
  receiptWindow.document.close();
}

export function ReceiptDialog({
  group,
  open,
  onOpenChange,
}: {
  group: PaymentGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receipt {group.receiptNumber ?? ""}</DialogTitle>
          <DialogDescription>
            {studentName(group) || "Student"} - {money(group.totalAmount)}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border p-4 text-sm">
          <div className="flex justify-between gap-4 border-b pb-3">
            <div>
              <p className="font-medium">{studentName(group) || "Student"}</p>
              {group.studentEmail && (
                <p className="text-muted-foreground">{group.studentEmail}</p>
              )}
            </div>
            <div className="text-right text-muted-foreground">
              <p>{group.paidDate ?? "-"}</p>
              <p>{group.status}</p>
            </div>
          </div>
          <div className="space-y-2 py-3">
            {group.lineItems.map((line) => (
              <div key={line.paymentId} className="flex justify-between gap-3">
                <span>
                  {line.className ?? "General"}
                  {line.sessionName ? ` (${line.sessionName})` : ""}
                </span>
                <span>{money(Number.parseFloat(line.amount) || 0)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 font-medium">
            <span>Total</span>
            <span>{money(group.totalAmount)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => printReceipt(group)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
          <Button type="button" asChild>
            <a href={receiptEmailHref(group)}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
