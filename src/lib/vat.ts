export interface VatCalculationResult {
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * Calculates VAT amounts based on a given amount and VAT rate.
 * 
 * @param amount - The base amount to calculate from (either net or total depending on isInclusive)
 * @param vatRate - The VAT rate as a percentage (e.g., 5 for 5%)
 * @param isInclusive - If true, the `amount` is treated as the total amount (VAT inclusive). If false, it's treated as the net amount (VAT exclusive).
 * @returns Object containing netAmount, vatAmount, and totalAmount
 */
export function calculateVat(
  amount: number,
  vatRate: number,
  isInclusive: boolean = false
): VatCalculationResult {
  const rateMultiplier = vatRate / 100;

  if (isInclusive) {
    const netAmount = amount / (1 + rateMultiplier);
    const vatAmount = amount - netAmount;
    
    return {
      netAmount: Number(netAmount.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalAmount: Number(amount.toFixed(2)),
    };
  } else {
    const vatAmount = amount * rateMultiplier;
    const totalAmount = amount + vatAmount;

    return {
      netAmount: Number(amount.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  }
}
