import { CustomerInvoice } from '@shared/api';

/**
 * Print utility functions for receipts
 */

// Format currency
const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('uz-UZ')} so'm`;
};

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Get receipt styles
const getReceiptStyles = (): string => {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .receipt-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .receipt-header h1 {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .receipt-header p {
      font-size: 14px;
      color: #666;
    }
    
    .receipt-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    
    .receipt-info div {
      font-size: 14px;
    }
    
    .receipt-info strong {
      font-weight: 600;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px 8px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
    }
    
    td {
      font-size: 14px;
    }
    
    td.text-right, th.text-right {
      text-align: right;
    }
    
    td.text-center, th.text-center {
      text-align: center;
    }
    
    tfoot td {
      font-weight: 600;
      font-size: 15px;
      padding-top: 15px;
      border-top: 2px solid #333;
      border-bottom: none;
    }
    
    .payment-summary {
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    
    .payment-summary div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .payment-summary div:last-child {
      margin-bottom: 0;
      font-weight: 600;
      font-size: 16px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }
    
    .receipt-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 14px;
      color: #666;
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
    }
    
    .signature-section div {
      text-align: center;
      font-size: 14px;
    }
    
    .pending-badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      margin-left: 8px;
      font-weight: 600;
    }
    
    .warehouse-header {
      background: #f0f9ff;
      border-color: #0284c7;
    }
    
    .profit-row {
      background: #f0fdf4;
      font-weight: 700;
    }
    
    .revenue-row {
      background: #fef3c7;
    }
    
    .no-print {
      text-align: center;
      margin-top: 20px;
    }
    
    .no-print button {
      padding: 10px 20px;
      margin: 0 5px;
      font-size: 14px;
      cursor: pointer;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 5px;
    }
    
    .no-print button:hover {
      background: #f5f5f5;
    }
    
    @media print {
      .no-print {
        display: none;
      }
      
      body {
        padding: 0;
      }
      
      @page {
        margin: 1cm;
      }
    }
  `;
};

// Generate customer receipt HTML
const generateCustomerReceiptHTML = (invoice: CustomerInvoice): string => {
  const hasDiscount = invoice.discountTotal > 0 || invoice.items.some(item => (item.discount || 0) > 0);
  const payableAmount = invoice.finalAmount || invoice.totalAmount;

  const itemsHTML = invoice.items.map((item, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${item.productName}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.sellingPrice)}</td>
      ${hasDiscount ? `<td class="text-center">${(item.discount || 0) > 0 ? item.discount + '%' : '-'}</td>` : ''}
      <td class="text-right">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="uz">
      <head>
        <meta charset="utf-8">
        <title>Chek - ${invoice.invoiceNumber}</title>
        <style>${getReceiptStyles()}</style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <h1>SAVDO CHEKI</h1>
            <p>Mijoz nusxasi</p>
            <p><strong>${invoice.invoiceNumber}</strong></p>
          </div>

          <div class="receipt-info">
            <div><strong>Mijoz:</strong> ${invoice.customerName}</div>
            <div><strong>Sana:</strong> ${formatDate(invoice.invoiceDate)}</div>
            ${invoice.organization ? `<div><strong>Tashkilot:</strong> ${invoice.organization}</div>` : ''}
            ${invoice.warehouseName ? `<div><strong>Ombor:</strong> ${invoice.warehouseName}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 50px;">№</th>
                <th>Mahsulot</th>
                <th class="text-center" style="width: 80px;">Miqdor</th>
                <th class="text-right" style="width: 130px;">Narx</th>
                ${hasDiscount ? '<th class="text-center" style="width: 80px;">Chegirma</th>' : ''}
                <th class="text-right" style="width: 140px;">Summa</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              ${hasDiscount ? `
              <tr>
                <td colspan="${hasDiscount ? 5 : 4}" class="text-right">Summa:</td>
                <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
              </tr>
              <tr style="color: #dc2626;">
                <td colspan="${hasDiscount ? 5 : 4}" class="text-right">Chegirma:</td>
                <td class="text-right">-${formatCurrency(invoice.discountTotal || 0)}</td>
              </tr>
              ` : ''}
              <tr>
                <td colspan="${hasDiscount ? 5 : 4}" class="text-right">JAMI:</td>
                <td class="text-right">${formatCurrency(payableAmount)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="payment-summary">
            <div>
              <span>To'langan:</span>
              <span>${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div>
              <span>Qoldiq:</span>
              <span>${formatCurrency(payableAmount - invoice.paidAmount)}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <p>Xaridingiz uchun rahmat!</p>
          </div>

          <div class="no-print">
            <button onclick="window.print()">Chop etish</button>
            <button onclick="window.close()">Yopish</button>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Generate warehouse receipt HTML
const generateWarehouseReceiptHTML = (invoice: CustomerInvoice): string => {
  const totalCost = invoice.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const revenue = invoice.finalAmount || invoice.totalAmount;
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : '0.00';

  const itemsHTML = invoice.items.map((item, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>
        ${item.productName}
        ${item.costPricePending ? '<span class="pending-badge">Taxminiy</span>' : ''}
      </td>
      <td class="text-center">${item.quantity}</td>
      <td>${item.warehouseName || '-'}</td>
      <td class="text-right">${formatCurrency(item.costPrice)}</td>
      <td class="text-right">${formatCurrency(item.costPrice * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="uz">
      <head>
        <meta charset="utf-8">
        <title>Ombor Cheki - ${invoice.invoiceNumber}</title>
        <style>${getReceiptStyles()}</style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header warehouse-header">
            <h1>OMBOR CHEKI</h1>
            <p>Ichki foydalanish uchun</p>
            <p><strong>${invoice.invoiceNumber}</strong></p>
          </div>
          
          <div class="receipt-info">
            <div><strong>Mijoz:</strong> ${invoice.customerName}</div>
            <div><strong>Sana:</strong> ${formatDate(invoice.invoiceDate)}</div>
            ${invoice.organization ? `<div><strong>Tashkilot:</strong> ${invoice.organization}</div>` : ''}
            ${invoice.warehouseName ? `<div><strong>Ombor:</strong> ${invoice.warehouseName}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 50px;">№</th>
                <th>Mahsulot</th>
                <th class="text-center" style="width: 100px;">Miqdor</th>
                <th style="width: 150px;">Ombor</th>
                <th class="text-right" style="width: 120px;">Tan narx</th>
                <th class="text-right" style="width: 120px;">Jami tan narx</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" class="text-right">JAMI TAN NARX:</td>
                <td class="text-right">${formatCurrency(totalCost)}</td>
              </tr>
              <tr class="revenue-row">
                <td colspan="5" class="text-right">SOTUV NARXI:</td>
                <td class="text-right">${formatCurrency(revenue)}</td>
              </tr>
              <tr class="profit-row">
                <td colspan="5" class="text-right">FOYDA (${profitMargin}%):</td>
                <td class="text-right">${formatCurrency(profit)}</td>
              </tr>
            </tfoot>
          </table>
          
          ${invoice.items.some(item => item.costPricePending) ? `
            <div class="payment-summary" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
              <div style="color: #92400e; font-weight: 600;">
                <span>⚠️ Diqqat:</span>
                <span>Ba'zi mahsulotlar uchun tan narx taxminiy</span>
              </div>
            </div>
          ` : ''}
          
          <div class="signature-section">
            <div>
              <p>Chiqargan: _______________</p>
              <p style="margin-top: 5px; color: #666; font-size: 12px;">Imzo / Sana</p>
            </div>
            <div>
              <p>Qabul qilgan: _______________</p>
              <p style="margin-top: 5px; color: #666; font-size: 12px;">Imzo / Sana</p>
            </div>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()">Chop etish</button>
            <button onclick="window.close()">Yopish</button>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Print HTML content via hidden iframe (no new tab/window opens)
 */
export const printViaIframe = (html: string): void => {
  // Remove "Chop etish" / "Yopish" buttons from printed HTML since we print directly
  const cleanHtml = html.replace(/<div class="no-print">[\s\S]*?<\/div>/, '');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(cleanHtml);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove iframe after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 200);
  };
};

/**
 * Print customer receipt
 */
export const printCustomerReceipt = (invoice: CustomerInvoice): void => {
  printViaIframe(generateCustomerReceiptHTML(invoice));
};

/**
 * Print warehouse receipt
 */
export const printWarehouseReceipt = (invoice: CustomerInvoice): void => {
  printViaIframe(generateWarehouseReceiptHTML(invoice));
};

/**
 * Print both receipts sequentially
 */
export const printBothReceipts = (invoice: CustomerInvoice): void => {
  printCustomerReceipt(invoice);
  setTimeout(() => {
    printWarehouseReceipt(invoice);
  }, 1500);
};

// ============================================
// ADDITIONAL PRINT TEMPLATES
// ============================================

/** Helper to print via iframe (replaces openPrintWindow) */
const openPrintWindow = (html: string): void => {
  printViaIframe(html);
};

const paymentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = { incoming: 'Kiruvchi', outgoing: 'Chiquvchi', transfer: "O'tkazma" };
  return labels[type] || type;
};

const paymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = { cash: 'Naqd pul', bank_transfer: "Bank o'tkazmasi", card: 'Plastik karta', other: 'Boshqa' };
  return labels[method] || method;
};

/**
 * Print payment receipt (to'lov kvitansiyasi)
 */
export const printPaymentReceipt = (payment: any): void => {
  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>To'lov - ${payment.paymentNumber}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <h1>TO'LOV KVITANSIYASI</h1>
            <p>${paymentTypeLabel(payment.type)} to'lov</p>
            <p><strong>${payment.paymentNumber}</strong></p>
          </div>
          <div class="receipt-info">
            <div><strong>Hamkor:</strong> ${payment.partnerName || '-'}</div>
            <div><strong>Sana:</strong> ${formatDate(payment.paymentDate)}</div>
            <div><strong>Hisob:</strong> ${payment.account === 'cash' ? 'Kassa' : 'Bank'}</div>
            <div><strong>Usul:</strong> ${paymentMethodLabel(payment.paymentMethod)}</div>
            ${payment.purpose ? `<div><strong>Maqsad:</strong> ${payment.purpose}</div>` : ''}
            ${payment.linkedDocumentNumber ? `<div><strong>Hujjat:</strong> ${payment.linkedDocumentNumber}</div>` : ''}
          </div>
          <div class="payment-summary" style="text-align: center;">
            <div style="font-size: 14px; color: #666;">To'lov summasi:</div>
            <div style="font-size: 28px; font-weight: 700; color: ${payment.type === 'incoming' ? '#16a34a' : '#dc2626'}; margin-top: 8px;">
              ${payment.type === 'outgoing' ? '-' : ''}${formatCurrency(payment.amount)}
            </div>
          </div>
          ${payment.notes ? `<div style="margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 13px;"><strong>Izoh:</strong> ${payment.notes}</div>` : ''}
          <div class="signature-section">
            <div><p>To'lovchi: _______________</p><p style="margin-top: 5px; color: #666; font-size: 12px;">Imzo / Sana</p></div>
            <div><p>Qabul qiluvchi: _______________</p><p style="margin-top: 5px; color: #666; font-size: 12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Print delivery note (yetkazib berish hujjati)
 */
export const printDeliveryNote = (shipment: any): void => {
  const itemsHTML = (shipment.items || []).map((item: any, i: number) => `
    <tr><td class="text-center">${i + 1}</td><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.price)}</td><td class="text-right">${formatCurrency(item.total)}</td></tr>
  `).join('');
  const statusLabels: Record<string, string> = { pending: 'Kutilmoqda', in_transit: "Yo'lda", delivered: 'Yetkazildi', cancelled: 'Bekor qilindi' };

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>Yetkazish - ${shipment.shipmentNumber}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header"><h1>YETKAZIB BERISH HUJJATI</h1><p><strong>${shipment.shipmentNumber}</strong></p></div>
          <div class="receipt-info">
            <div><strong>Mijoz:</strong> ${shipment.customerName}</div>
            <div><strong>Sana:</strong> ${formatDate(shipment.shipmentDate)}</div>
            ${shipment.receiver ? `<div><strong>Qabul qiluvchi:</strong> ${shipment.receiver}</div>` : ''}
            <div><strong>Ombor:</strong> ${shipment.warehouseName || '-'}</div>
            <div><strong>Buyurtma:</strong> ${shipment.orderNumber}</div>
            <div><strong>Holat:</strong> ${statusLabels[shipment.status] || shipment.status}</div>
            ${shipment.deliveryAddress ? `<div style="grid-column: span 2;"><strong>Manzil:</strong> ${shipment.deliveryAddress}</div>` : ''}
            ${shipment.trackingNumber ? `<div><strong>Kuzatuv:</strong> ${shipment.trackingNumber}</div>` : ''}
          </div>
          <table>
            <thead><tr><th class="text-center" style="width:50px;">No</th><th>Mahsulot</th><th class="text-center" style="width:100px;">Miqdor</th><th class="text-right" style="width:130px;">Narx</th><th class="text-right" style="width:140px;">Summa</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot><tr><td colspan="4" class="text-right">JAMI:</td><td class="text-right">${formatCurrency(shipment.totalAmount)}</td></tr></tfoot>
          </table>
          ${shipment.notes ? `<div style="margin:15px 0;padding:10px;background:#f9f9f9;border-radius:5px;font-size:13px;"><strong>Izoh:</strong> ${shipment.notes}</div>` : ''}
          <div class="signature-section">
            <div><p>Yetkazuvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
            <div><p>Qabul qiluvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Print debt statement (qarz bayonnomasi)
 */
export const printDebtStatement = (data: {
  partnerName: string; totalDebt: number; paidAmount: number; remainingDebt: number;
  transactions: Array<{ date: string; type: string; number: string; amount: number; }>;
}): void => {
  const rowsHTML = data.transactions.map((tx, i) => `
    <tr><td class="text-center">${i + 1}</td><td>${formatDate(tx.date)}</td><td>${tx.type}</td><td>${tx.number}</td><td class="text-right">${formatCurrency(tx.amount)}</td></tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>Qarz - ${data.partnerName}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header"><h1>QARZ BAYONNOMASI</h1><p><strong>${data.partnerName}</strong></p><p>Sana: ${formatDate(new Date().toISOString())}</p></div>
          <div class="payment-summary">
            <div><span>Jami qarz:</span><span>${formatCurrency(data.totalDebt)}</span></div>
            <div><span>To'langan:</span><span>${formatCurrency(data.paidAmount)}</span></div>
            <div><span>Qoldiq qarz:</span><span style="color:${data.remainingDebt > 0 ? '#dc2626' : '#16a34a'};font-weight:700;">${formatCurrency(data.remainingDebt)}</span></div>
          </div>
          ${data.transactions.length > 0 ? `
          <table>
            <thead><tr><th class="text-center" style="width:50px;">No</th><th style="width:120px;">Sana</th><th>Turi</th><th>Hujjat</th><th class="text-right" style="width:150px;">Summa</th></tr></thead>
            <tbody>${rowsHTML}</tbody>
          </table>` : '<p style="text-align:center;color:#666;margin:20px 0;">Tranzaksiyalar topilmadi</p>'}
          <div class="signature-section">
            <div><p>Sotuvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
            <div><p>Mijoz: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Print warehouse incoming order (ombor kirim orderi)
 */
export const printWarehouseIncoming = (receipt: any): void => {
  const itemsHTML = (receipt.items || []).map((item: any, i: number) => `
    <tr><td class="text-center">${i + 1}</td><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.costPrice)}</td><td class="text-right">${formatCurrency(item.total || item.costPrice * item.quantity)}</td></tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>Kirim - ${receipt.receiptNumber}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header" style="background:#f0fdf4;border-color:#16a34a;"><h1>OMBOR KIRIM ORDERI</h1><p><strong>${receipt.receiptNumber}</strong></p></div>
          <div class="receipt-info">
            <div><strong>Yetkazuvchi:</strong> ${receipt.supplierName || '-'}</div>
            <div><strong>Sana:</strong> ${formatDate(receipt.receiptDate)}</div>
            <div><strong>Ombor:</strong> ${receipt.warehouseName || '-'}</div>
            ${receipt.orderNumber ? `<div><strong>Buyurtma:</strong> ${receipt.orderNumber}</div>` : ''}
          </div>
          <table>
            <thead><tr><th class="text-center" style="width:50px;">No</th><th>Mahsulot</th><th class="text-center" style="width:100px;">Miqdor</th><th class="text-right" style="width:130px;">Tan narx</th><th class="text-right" style="width:140px;">Summa</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot><tr><td colspan="4" class="text-right">JAMI:</td><td class="text-right">${formatCurrency(receipt.totalAmount)}</td></tr></tfoot>
          </table>
          ${receipt.notes ? `<div style="margin:15px 0;padding:10px;background:#f9f9f9;border-radius:5px;font-size:13px;"><strong>Izoh:</strong> ${receipt.notes}</div>` : ''}
          <div class="signature-section">
            <div><p>Topshiruvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
            <div><p>Qabul qiluvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Print warehouse outgoing order (ombor chiqim orderi)
 */
export const printWarehouseOutgoing = (expense: any): void => {
  const itemsHTML = (expense.items || []).map((item: any, i: number) => `
    <tr><td class="text-center">${i + 1}</td><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.costPrice || item.price || 0)}</td><td class="text-right">${formatCurrency(item.total || (item.costPrice || item.price || 0) * item.quantity)}</td></tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>Chiqim - ${expense.expenseNumber || expense.writeoffNumber || ''}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header" style="background:#fef2f2;border-color:#dc2626;"><h1>OMBOR CHIQIM ORDERI</h1><p><strong>${expense.expenseNumber || expense.writeoffNumber || ''}</strong></p></div>
          <div class="receipt-info">
            ${expense.reason ? `<div><strong>Sabab:</strong> ${expense.reason}</div>` : ''}
            <div><strong>Sana:</strong> ${formatDate(expense.expenseDate || expense.writeoffDate || expense.createdAt)}</div>
            <div><strong>Ombor:</strong> ${expense.warehouseName || '-'}</div>
          </div>
          <table>
            <thead><tr><th class="text-center" style="width:50px;">No</th><th>Mahsulot</th><th class="text-center" style="width:100px;">Miqdor</th><th class="text-right" style="width:130px;">Narx</th><th class="text-right" style="width:140px;">Summa</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot><tr><td colspan="4" class="text-right">JAMI:</td><td class="text-right">${formatCurrency(expense.totalAmount || expense.totalCost || 0)}</td></tr></tfoot>
          </table>
          ${expense.notes ? `<div style="margin:15px 0;padding:10px;background:#f9f9f9;border-radius:5px;font-size:13px;"><strong>Izoh:</strong> ${expense.notes}</div>` : ''}
          <div class="signature-section">
            <div><p>Chiqargan: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
            <div><p>Tasdiqlagan: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Print return document (qaytarish hujjati)
 */
export const printReturnDocument = (returnData: any): void => {
  const isCustomerReturn = !!returnData.customerName;
  const partnerName = returnData.customerName || returnData.supplierName || '-';
  const reasonLabels: Record<string, string> = { defective: 'Nuqsonli', wrong_item: "Noto'g'ri mahsulot", customer_request: 'Mijoz talabi', incorrect_model: "Noto'g'ri model", shortages: 'Kam yetkazilgan', other: 'Boshqa' };

  const itemsHTML = (returnData.items || []).map((item: any, i: number) => `
    <tr><td class="text-center">${i + 1}</td><td>${item.productName}</td><td class="text-center">${item.quantity}</td><td class="text-right">${formatCurrency(item.costPrice || item.price || 0)}</td><td class="text-right">${formatCurrency(item.total || (item.costPrice || item.price || 0) * item.quantity)}</td></tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="uz">
      <head><meta charset="utf-8"><title>Qaytarish - ${returnData.returnNumber || ''}</title><style>${getReceiptStyles()}</style></head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header" style="background:#fef3c7;border-color:#f59e0b;"><h1>${isCustomerReturn ? 'MIJOZDAN QAYTARISH' : 'YETKAZUVCHIGA QAYTARISH'}</h1><p><strong>${returnData.returnNumber || ''}</strong></p></div>
          <div class="receipt-info">
            <div><strong>${isCustomerReturn ? 'Mijoz' : 'Yetkazuvchi'}:</strong> ${partnerName}</div>
            <div><strong>Sana:</strong> ${formatDate(returnData.returnDate || returnData.createdAt)}</div>
            ${returnData.reason ? `<div><strong>Sabab:</strong> ${reasonLabels[returnData.reason] || returnData.reason}</div>` : ''}
            ${returnData.warehouseName ? `<div><strong>Ombor:</strong> ${returnData.warehouseName}</div>` : ''}
            ${returnData.invoiceNumber ? `<div><strong>Faktura:</strong> ${returnData.invoiceNumber}</div>` : ''}
          </div>
          <table>
            <thead><tr><th class="text-center" style="width:50px;">No</th><th>Mahsulot</th><th class="text-center" style="width:100px;">Miqdor</th><th class="text-right" style="width:130px;">Narx</th><th class="text-right" style="width:140px;">Summa</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
            <tfoot><tr><td colspan="4" class="text-right">JAMI:</td><td class="text-right">${formatCurrency(returnData.totalAmount || 0)}</td></tr></tfoot>
          </table>
          ${returnData.notes ? `<div style="margin:15px 0;padding:10px;background:#f9f9f9;border-radius:5px;font-size:13px;"><strong>Izoh:</strong> ${returnData.notes}</div>` : ''}
          <div class="signature-section">
            <div><p>Qaytaruvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
            <div><p>Qabul qiluvchi: _______________</p><p style="margin-top:5px;color:#666;font-size:12px;">Imzo / Sana</p></div>
          </div>
          <div class="no-print"><button onclick="window.print()">Chop etish</button><button onclick="window.close()">Yopish</button></div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};
