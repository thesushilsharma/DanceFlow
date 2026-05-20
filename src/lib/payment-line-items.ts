export type ClassLineItem = {
  classId: string;
  sessionId?: string | null;
  amount: number;
  offerId?: string | null;
  discountAmount?: number;
};

export function parseClassLineItems(raw: string | null): ClassLineItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map<ClassLineItem | null>((item) => {
        if (!item || typeof item !== "object") return null;
        const classId = "classId" in item ? String(item.classId) : "";
        const amount =
          "amount" in item
            ? Number.parseFloat(String(item.amount))
            : Number.NaN;
        const sessionId =
          "sessionId" in item && item.sessionId
            ? String(item.sessionId).trim()
            : null;
        const offerId =
          "offerId" in item && item.offerId
            ? String(item.offerId).trim()
            : null;
        const discountAmount =
          "discountAmount" in item
            ? Number.parseFloat(String(item.discountAmount))
            : Number.NaN;
        if (!classId.trim() || Number.isNaN(amount) || amount <= 0) return null;
        return {
          classId: classId.trim(),
          sessionId,
          amount,
          offerId: offerId || null,
          discountAmount:
            Number.isNaN(discountAmount) || discountAmount <= 0
              ? 0
              : discountAmount,
        };
      })
      .filter((item): item is ClassLineItem => item !== null);
  } catch {
    return [];
  }
}

export function splitDiscountAcrossLines(
  lines: ClassLineItem[],
  totalDiscount: number,
): (ClassLineItem & { discountAmount: number; finalAmount: number })[] {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  if (subtotal <= 0) return [];

  let allocatedDiscount = 0;
  return lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    const lineDiscount = isLast
      ? Math.max(0, totalDiscount - allocatedDiscount)
      : Math.round((line.amount / subtotal) * totalDiscount * 100) / 100;
    allocatedDiscount += lineDiscount;
    const finalAmount = Math.max(0, line.amount - lineDiscount);
    return { ...line, discountAmount: lineDiscount, finalAmount };
  });
}

export type PreparedClassPaymentLine = ClassLineItem & {
  discountAmount: number;
  finalAmount: number;
};

export function prepareClassPaymentLines(
  lines: ClassLineItem[],
  cartDiscountAmount: number,
): PreparedClassPaymentLine[] {
  const hasLineScopedOffer = lines.some(
    (line) => line.offerId || (line.discountAmount ?? 0) > 0,
  );

  if (!hasLineScopedOffer) {
    return splitDiscountAcrossLines(lines, cartDiscountAmount);
  }

  return lines.map((line) => {
    const discountAmount = Math.min(
      line.amount,
      Math.max(0, line.discountAmount ?? 0),
    );
    return {
      ...line,
      discountAmount,
      finalAmount: Math.max(0, line.amount - discountAmount),
    };
  });
}
