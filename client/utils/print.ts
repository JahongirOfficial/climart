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
  const itemsHTML = invoice.items.map((item, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${item.productName}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.sellingPrice)}</td>
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
                <th class="text-center" style="width: 100px;">Miqdor</th>
                <th class="text-right" style="width: 150px;">Narx</th>
                <th class="text-right" style="width: 150px;">Summa</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right">JAMI:</td>
                <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
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
              <span>${formatCurrency(invoice.totalAmount - invoice.paidAmount)}</span>
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
  const profit = invoice.totalAmount - totalCost;
  const profitMargin = invoice.totalAmount > 0 ? ((profit / invoice.totalAmount) * 100).toFixed(2) : '0.00';

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
                <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
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
 * Print customer receipt
 */
export const printCustomerReceipt = (invoice: CustomerInvoice): void => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Iltimos, popup blokirovkasini o\'chiring');
    return;
  }
  
  const html = generateCustomerReceiptHTML(invoice);
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Auto-trigger print dialog after content loads
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};

/**
 * Print warehouse receipt
 */
export const printWarehouseReceipt = (invoice: CustomerInvoice): void => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Iltimos, popup blokirovkasini o\'chiring');
    return;
  }
  
  const html = generateWarehouseReceiptHTML(invoice);
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Auto-trigger print dialog after content loads
  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
};

/**
 * Print both receipts sequentially
 */
export const printBothReceipts = (invoice: CustomerInvoice): void => {
  // Print customer receipt first
  printCustomerReceipt(invoice);
  
  // Print warehouse receipt after a short delay
  setTimeout(() => {
    printWarehouseReceipt(invoice);
  }, 500);
};
