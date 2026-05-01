function makeFileName(prefix) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}`;
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadReportExcel(rows, prefix = "report") {
  const headers = [
    "Date",
    "Slip No",
    "Customer Name",
    "Vehicle No",
    "Material",
    "Quantity",
    "Amount",
    "GST",
    "Total",
    "Balance"
  ];

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.date,
        row.slipNo,
        row.customerName,
        row.vehicle,
        row.material,
        row.quantity,
        row.amount,
        row.gst ?? "",
        row.total,
        row.balance
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${makeFileName(prefix)}.csv`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2) : "0.00";
}

function buildStatementHtml(statement) {
  const rows = Array.isArray(statement?.rows) ? statement.rows : [];
  const totals = statement?.totals || {};
  const isCustomerStatement = String(statement?.statementType || "").toUpperCase().includes("CUSTOMER");

  return `
    <html>
      <head>
        <title>${escapeHtml(statement.statementType || "Statement")}</title>
        <style>
          @page { size: A4 portrait; margin: 16mm; }
          body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
          .header { padding: 14px 16px; border-bottom: 1px solid #cbd5e1; }
          .title { margin: 0; font-size: 18px; font-weight: 700; }
          .sub { margin: 4px 0 0; font-size: 12px; color: #475569; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .label { color: #475569; margin-right: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #e2e8f0; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; font-weight: 600; }
          .num { text-align: right; }
          .totals { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-top: 1px solid #cbd5e1; }
          .totals .left, .totals .right { padding: 10px 16px; font-size: 12px; }
          .totals .right { border-left: 1px solid #cbd5e1; }
          .line { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .line strong { font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 class="title">${escapeHtml(statement.partyName || statement.statementType || "Report")}</h1>
            <p class="sub">${escapeHtml(statement.statementType || "Statement")}</p>
          </div>
          <div class="grid">
            <div><span class="label">Party:</span>${escapeHtml(statement.partyName || "-")}</div>
            <div><span class="label">Period:</span>${escapeHtml(statement.period || "-")}</div>
            <div><span class="label">Opening Balance:</span>Rs ${toMoney(statement.openingBalance)}</div>
            <div><span class="label">Closing Balance:</span>Rs ${toMoney(statement.closingBalance)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                ${isCustomerStatement ? "" : '<th class="num">Qty</th><th class="num">Amount</th><th class="num">GST</th><th class="num">Total</th>'}
                <th class="num">Credit</th>
                <th class="num">Debit</th>
                <th class="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `<tr>
                    <td>${escapeHtml(row.date)}</td>
                    <td>${escapeHtml(row.reference)}</td>
                    <td>${escapeHtml(row.description)}</td>
                    ${isCustomerStatement ? "" : `<td class="num">${escapeHtml(row.quantity ?? "")}</td>
                    <td class="num">${escapeHtml(row.amount ?? "")}</td>
                    <td class="num">${escapeHtml(row.gst ?? "")}</td>
                    <td class="num">${escapeHtml(row.total ?? "")}</td>`}
                    <td class="num">${escapeHtml(row.credit ?? "")}</td>
                    <td class="num">${escapeHtml(row.debit ?? "")}</td>
                    <td class="num">${escapeHtml(row.balance ?? "")}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="totals">
            <div class="left">
              <div class="line"><span>Total Credit</span><strong>Rs ${toMoney(totals.credit || 0)}</strong></div>
              <div class="line"><span>Total Debit</span><strong>Rs ${toMoney(totals.debit || 0)}</strong></div>
            </div>
            <div class="right" ${isCustomerStatement ? 'style="display:none;"' : ""}>
              <div class="line"><span>Total Amount</span><strong>Rs ${toMoney(totals.amount || 0)}</strong></div>
              <div class="line"><span>Total GST</span><strong>Rs ${toMoney(totals.gst || 0)}</strong></div>
              <div class="line"><span>Grand Total</span><strong>Rs ${toMoney(totals.total || 0)}</strong></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function downloadStatementCsv(statement, prefix = "statement") {
  const rows = Array.isArray(statement?.rows) ? statement.rows : [];
  const isCustomerStatement = String(statement?.statementType || "").toUpperCase().includes("CUSTOMER");
  const headers = isCustomerStatement
    ? ["Date", "Reference", "Description", "Credit", "Debit", "Balance"]
    : ["Date", "Reference", "Description", "Quantity", "Amount", "GST", "Total", "Credit", "Debit", "Balance"];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      (isCustomerStatement
        ? [row.date, row.reference, row.description, row.credit, row.debit, row.balance]
        : [row.date, row.reference, row.description, row.quantity, row.amount, row.gst, row.total, row.credit, row.debit, row.balance])
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${makeFileName(prefix)}.csv`);
}

export function printStatementPdf(statement) {
  const tab = window.open("", "_blank");
  if (!tab) return;
  tab.document.write(buildStatementHtml(statement));
  tab.document.close();
  tab.focus();
  tab.print();
}
