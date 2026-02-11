import CustomerInvoice from '../models/CustomerInvoice';

/**
 * Automatically corrects invoices that were sold with negative stock
 * when new stock arrives and the actual cost price is determined.
 */
export async function correctPendingInvoices(productId: string, actualCostPrice: number, session?: any) {
    try {
        const pendingInvoices = await CustomerInvoice.find({
            'items.product': productId,
            'items.costPricePending': true
        }).session(session);

        for (const invoice of pendingInvoices) {
            let updated = false;
            invoice.items.forEach(invItem => {
                if (invItem.product.toString() === productId.toString() && invItem.costPricePending) {
                    invItem.costPrice = actualCostPrice;
                    invItem.costPricePending = false;
                    updated = true;
                }
            });

            if (updated) {
                invoice.isMinusCorrection = true;
                await invoice.save({ session });
                console.log(`[MinusCorrection] Updated cost price for invoice ${invoice.invoiceNumber}, product ${productId}`);
            }
        }
    } catch (error) {
        console.error(`[MinusCorrectionError] Failed to correct invoices for product ${productId}:`, error);
    }
}
