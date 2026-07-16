/**
 * Calculates the maximum number of installments and the value of each installment.
 * Rule: Up to 12x, but each installment must be at least R$ 20.00.
 */
export function getInstallments(price: number): { count: number; value: number } {
    if (!price || price <= 0) return { count: 1, value: 0 };
    
    const minInstallmentValue = 20;
    const maxInstallmentsLimit = 12;

    // Calculate maximum possible installments based on minimum value
    let maxInstallments = Math.floor(price / minInstallmentValue);
    
    // Cap at 12x
    maxInstallments = Math.min(maxInstallmentsLimit, maxInstallments);
    
    // If price is less than minInstallmentValue, we can only have 1 installment
    if (maxInstallments < 1) {
        maxInstallments = 1;
    }
    
    const value = price / maxInstallments;
    
    return { count: maxInstallments, value };
}

/**
 * Returns an array of available installment options for a given price.
 */
export function getInstallmentOptions(price: number): { count: number; value: number; total: number }[] {
    const { count } = getInstallments(price);
    const options = [];
    
    for (let i = 1; i <= count; i++) {
        options.push({
            count: i,
            value: price / i,
            total: price
        });
    }
    
    return options;
}
