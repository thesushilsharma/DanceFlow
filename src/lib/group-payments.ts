export type PaymentLineRow = {
  paymentId: string;
  classId: string | null;
  className: string | null;
  sessionId: string | null;
  sessionName: string | null;
  amount: string;
  discountAmount: string | null;
  status: string;
};

export type PaymentGroup = {
  groupKey: string;
  paymentGroupId: string | null;
  receiptNumber: string | null;
  referenceNumber: string | null;
  studentId: string;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentEmail: string | null;
  paidDate: string | null;
  method: string | null;
  paymentType: string | null;
  status: string;
  rawStatus: string;
  totalAmount: number;
  totalDiscount: number;
  offerTitle: string | null;
  notes: string | null;
  classLabel: string;
  lineItems: PaymentLineRow[];
  paymentIds: string[];
  isGrouped: boolean;
};

type RawPaymentRow = {
  id: string;
  paymentGroupId: string | null;
  amount: string;
  discountAmount: string | null;
  paymentDate: string | null;
  status: string;
  paymentMethod: string | null;
  paymentType: string | null;
  receiptNumber: string | null;
  referenceNumber: string | null;
  notes: string | null;
  studentId: string;
  classId: string | null;
  sessionId: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  studentEmail: string | null;
  className: string | null;
  sessionName: string | null;
  offerTitle: string | null;
};

function groupKeyFor(row: RawPaymentRow): string {
  if (row.paymentGroupId) return `g:${row.paymentGroupId}`;
  if (row.receiptNumber) {
    return `r:${row.studentId}:${row.paymentDate}:${row.receiptNumber}`;
  }
  return `s:${row.id}`;
}

export function groupPaymentRows(rows: RawPaymentRow[]): PaymentGroup[] {
  const map = new Map<string, PaymentGroup>();

  for (const row of rows) {
    const key = groupKeyFor(row);
    let group = map.get(key);

    if (!group) {
      group = {
        groupKey: key,
        paymentGroupId: row.paymentGroupId,
        receiptNumber: row.receiptNumber,
        referenceNumber: row.referenceNumber,
        studentId: row.studentId,
        studentFirstName: row.studentFirstName,
        studentLastName: row.studentLastName,
        studentEmail: row.studentEmail,
        paidDate: row.paymentDate ? String(row.paymentDate) : null,
        method: row.paymentMethod,
        paymentType: row.paymentType,
        status: row.status,
        rawStatus: row.status,
        totalAmount: 0,
        totalDiscount: 0,
        offerTitle: row.offerTitle,
        notes: row.notes,
        classLabel: "",
        lineItems: [],
        paymentIds: [],
        isGrouped: false,
      };
      map.set(key, group);
    }

    const amount = Number.parseFloat(row.amount) || 0;
    const discount = Number.parseFloat(row.discountAmount ?? "0") || 0;
    group.totalAmount += amount;
    group.totalDiscount += discount;
    group.paymentIds.push(row.id);
    group.lineItems.push({
      paymentId: row.id,
      classId: row.classId,
      className: row.className,
      sessionId: row.sessionId,
      sessionName: row.sessionName,
      amount: row.amount,
      discountAmount: row.discountAmount,
      status: row.status,
    });

    if (row.status === "pending") group.rawStatus = "pending";
    if (row.status === "refunded" || row.status === "cancelled") {
      group.rawStatus = row.status;
    }
  }

  return [...map.values()].map((group) => {
    const names = group.lineItems
      .map((line) => {
        if (line.sessionName && line.className) {
          return `${line.className} (${line.sessionName})`;
        }
        return line.className ?? "General";
      })
      .filter((name, i, arr) => arr.indexOf(name) === i);

    return {
      ...group,
      isGrouped: group.lineItems.length > 1,
      classLabel: names.length > 0 ? names.join(" + ") : "—",
      status:
        group.rawStatus === "completed"
          ? "paid"
          : group.rawStatus === "pending"
            ? "pending"
            : group.rawStatus,
    };
  });
}
