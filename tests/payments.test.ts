import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncEnrollmentsForClassPayment } from "../src/lib/payment-enrollments";
import {
  parseClassLineItems,
  prepareClassPaymentLines,
} from "../src/lib/payment-line-items";

function makeTx(selectResults: unknown[][]) {
  const updates: unknown[] = [];
  const inserts: unknown[] = [];

  return {
    updates,
    inserts,
    select: () => {
      const result = selectResults.shift() ?? [];
      const whereResult = Promise.resolve(result) as Promise<unknown[]> & {
        limit: (count: number) => Promise<unknown[]>;
      };
      whereResult.limit = () => Promise.resolve(result);
      return {
        from: () => ({
          where: () => whereResult,
        }),
      };
    },
    update: () => ({
      set: (values: unknown) => {
        updates.push(values);
        return { where: async () => undefined };
      },
    }),
    insert: () => ({
      values: async (values: unknown) => {
        inserts.push(values);
      },
    }),
  };
}

describe("createPayment line-item preparation", () => {
  it("keeps class-scoped offers on only the discounted line", () => {
    const lines = parseClassLineItems(
      JSON.stringify([
        {
          classId: "class-a",
          sessionId: null,
          offerId: "offer-a",
          amount: 100,
          discountAmount: 10,
        },
        {
          classId: "class-b",
          sessionId: null,
          offerId: null,
          amount: 50,
          discountAmount: 0,
        },
      ]),
    );

    const prepared = prepareClassPaymentLines(lines, 10);

    assert.equal(prepared[0].offerId, "offer-a");
    assert.equal(prepared[0].discountAmount, 10);
    assert.equal(prepared[0].finalAmount, 90);
    assert.equal(prepared[1].offerId, null);
    assert.equal(prepared[1].discountAmount, 0);
    assert.equal(prepared[1].finalAmount, 50);
  });

  it("still splits legacy cart-level discounts across classes", () => {
    const prepared = prepareClassPaymentLines(
      [
        { classId: "class-a", sessionId: null, amount: 100 },
        { classId: "class-b", sessionId: null, amount: 50 },
      ],
      15,
    );

    assert.deepEqual(
      prepared.map((line) => ({
        classId: line.classId,
        discountAmount: line.discountAmount,
        finalAmount: line.finalAmount,
      })),
      [
        { classId: "class-a", discountAmount: 10, finalAmount: 90 },
        { classId: "class-b", discountAmount: 5, finalAmount: 45 },
      ],
    );
  });
});

describe("syncEnrollmentsForClassPayment", () => {
  it("links an existing enrollment to the payment without marking pending payments paid", async () => {
    const tx = makeTx([[{ id: "enrollment-1", paymentStatus: "pending" }]]);

    await syncEnrollmentsForClassPayment(
      tx,
      "student-1",
      { classId: "class-a", sessionId: null, paymentId: "payment-1" },
      "2026-05-20",
      false,
    );

    assert.equal(tx.inserts.length, 0);
    assert.equal(tx.updates.length, 1);
    assert.equal(
      (tx.updates[0] as { paymentId: string }).paymentId,
      "payment-1",
    );
    assert.equal(
      (tx.updates[0] as { paymentStatus: string }).paymentStatus,
      "pending",
    );
  });

  it("creates a paid class enrollment for completed payments", async () => {
    const tx = makeTx([
      [],
      [{ name: "Ballet", maxCapacity: 2 }],
      [{ count: 1 }],
    ]);

    await syncEnrollmentsForClassPayment(
      tx,
      "student-1",
      { classId: "class-a", sessionId: null, paymentId: "payment-1" },
      "2026-05-20",
      true,
    );

    assert.equal(tx.updates.length, 0);
    assert.deepEqual(tx.inserts[0], {
      studentId: "student-1",
      classId: "class-a",
      sessionId: null,
      paymentId: "payment-1",
      enrollmentDate: "2026-05-20",
      status: "active",
      paymentStatus: "paid",
    });
  });
});
