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
    "Rate",
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
        row.rate,
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

export function downloadReportPdf(rows, title = "Sales Report") {
  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { border-collapse: collapse; width: 100%; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
          th { background: #e2e8f0; }
          h2 { margin: 0 0 10px; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Slip No</th><th>Customer Name</th><th>Vehicle No</th><th>Material</th>
              <th>Qty</th><th>Rate</th><th>Amount</th><th>GST</th><th>Total</th><th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `<tr>
                <td>${row.date ?? ""}</td><td>${row.slipNo ?? ""}</td><td>${row.customerName ?? ""}</td>
                <td>${row.vehicle ?? ""}</td><td>${row.material ?? ""}</td><td>${row.quantity ?? ""}</td>
                <td>${row.rate ?? ""}</td><td>${row.amount ?? ""}</td><td>${row.gst ?? ""}</td>
                <td>${row.total ?? ""}</td><td>${row.balance ?? ""}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const tab = window.open("", "_blank");
  if (!tab) return;
  tab.document.write(html);
  tab.document.close();
  tab.focus();
  tab.print();
}