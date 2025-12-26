/**
 * Print Export Service for Loans Dashboard
 * Handles printing and exporting of loan-related documents
 */

import { formatDateDDMMYYYY } from '../utils/dateFormatter';

const printExportService = {
  /**
   * Print loan release receipt
   * @param {Object} loan - The loan object
   */
  printLoanReleaseReceipt: async (loan) => {
    try {
      // Create a printable version of the loan receipt
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Loan Release Receipt - ${loan.ref_no}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                line-height: 1.6;
              }
              .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #ccc;
                padding: 20px;
                border-radius: 8px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .receipt-body {
                margin-bottom: 20px;
              }
              .receipt-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
              }
              .receipt-label {
                font-weight: bold;
                width: 40%;
              }
              .receipt-value {
                text-align: right;
                width: 60%;
              }
              .section-title {
                font-weight: bold;
                background-color: #f5f5f5;
                padding: 10px;
                margin-top: 15px;
                margin-bottom: 10px;
                border-radius: 4px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ccc;
                font-size: 12px;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .receipt-container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="header">
                <h1>LOAN RELEASE RECEIPT</h1>
                <p>Date: ${formatDateDDMMYYYY(new Date())}</p>
              </div>
              
              <div class="receipt-body">
                <div class="section-title">LOAN DETAILS</div>
                <div class="receipt-row">
                  <div class="receipt-label">Loan Reference No:</div>
                  <div class="receipt-value">${loan.ref_no}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Borrower Name:</div>
                  <div class="receipt-value">${loan.full_name}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Customer ID:</div>
                  <div class="receipt-value">${loan.customer_id}</div>
                </div>
                
                <div class="section-title">FINANCIAL DETAILS</div>
                <div class="receipt-row">
                  <div class="receipt-label">Loan Amount:</div>
                  <div class="receipt-value">₹${Number(loan.amount).toLocaleString('en-IN')}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Eligible Amount:</div>
                  <div class="receipt-value">₹${Number(loan.eligible_amount).toLocaleString('en-IN')}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Interest Rate:</div>
                  <div class="receipt-value">${loan.active_interest_rate}% p.a.</div>
                </div>
                
                <div class="section-title">GOLD DETAILS</div>
                <div class="receipt-row">
                  <div class="receipt-label">Gross Weight:</div>
                  <div class="receipt-value">${loan.gross_weight} grams</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Net Weight:</div>
                  <div class="receipt-value">${loan.net_weight} grams</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Gold Rate (per gram):</div>
                  <div class="receipt-value">₹${Number(loan.gold_rate).toLocaleString('en-IN')}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Gold Details:</div>
                  <div class="receipt-value">${loan.gold_details}</div>
                </div>
                
                <div class="section-title">DATE DETAILS</div>
                <div class="receipt-row">
                  <div class="receipt-label">Loan Release Date:</div>
                  <div class="receipt-value">${formatDateDDMMYYYY(loan.loan_release_date)}</div>
                </div>
                <div class="receipt-row">
                  <div class="receipt-label">Interest Start Date:</div>
                  <div class="receipt-value">${formatDateDDMMYYYY(loan.interest_start_date)}</div>
                </div>
                
                <div class="section-title">PURPOSE</div>
                <div class="receipt-row">
                  <div class="receipt-label">Purpose:</div>
                  <div class="receipt-value">${loan.purpose}</div>
                </div>
              </div>
              
              <div class="footer">
                <p>This is a computer-generated receipt. No signature required.</p>
                <p>Printed on: ${new Date().toLocaleString('en-IN')}</p>
              </div>
            </div>
            <script>
              window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing loan release receipt:', error);
      throw error;
    }
  },

  /**
   * Export loan details to CSV
   * @param {Array} loans - Array of loans to export
   * @param {string} filename - Name of the file to save
   */
  exportLoansToCSV: (loans, filename = 'loans.csv') => {
    try {
      const headers = [
        'Ref No',
        'Borrower',
        'Customer ID',
        'Loan Amount',
        'Status',
        'Release Date',
        'Purpose',
      ];

      const rows = loans.map(loan => [
        loan.ref_no,
        loan.full_name,
        loan.customer_id,
        loan.amount,
        loan.status === 1 ? 'Pending' : loan.status === 2 ? 'Sanctioned' : 'Closed',
        formatDateDDMMYYYY(loan.loan_release_date),
        loan.purpose,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting loans to CSV:', error);
      throw error;
    }
  },
};

export { printExportService };
