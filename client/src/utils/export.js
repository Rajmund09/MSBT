/**
 * MSBT Export Utilities
 * - Excel (.xlsx) via SheetJS
 * - CSV (native)
 * - PDF (via jsPDF)
 */

// CSV Export
export function exportToCSV(data, filename = "export") {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), `${filename}.csv`);
}

// Excel Export
export async function exportToExcel(data, filename = "export", sheetName = "Sheet1") {
  if (!data || data.length === 0) return;
  try {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (err) {
    console.error("Excel export failed:", err);
    throw err;
  }
}

// Helper
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Format customer data for export
export function formatCustomersForExport(customers, seasonName = "All") {
  return customers.map(c => ({
    "Name": c.name,
    "Entry Date": c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
    "Season Name": c.seasonName || seasonName,
    "Facility Details - Trip": c.totalTrips || 0,
    "Facility Details - Minute": c.totalMinutes || 0,
    "Facility Details - Trade": c.totalTrades || 0,
    "Total Revenue": c.totalRevenue || 0,
    "Total Paid": c.totalPaid || 0,
    "Outstanding": c.outstanding || 0,
    "Last Edited By": c.lastEditedBy || "System",
  }));
}

export function formatEntriesForExport(entries) {
  return entries.map(e => ({
    "Date": e.entry_date,
    "Customer": e.customer_name,
    "Village": e.customer_village,
    "Season": e.season_name,
    "Type": e.entry_type,
    "Quantity": e.quantity,
    "Rate (₹)": e.rate,
    "Total Amount (₹)": e.total_amount,
    "Description": e.description || "",
  }));
}

export function formatPaymentsForExport(payments) {
  return payments.map(p => ({
    "Date": p.payment_date,
    "Customer": p.customer_name,
    "Village": p.customer_village,
    "Season": p.season_name,
    "Amount (₹)": p.amount,
    "Mode": p.payment_mode,
    "Reference": p.reference_no || "",
    "Notes": p.notes || "",
  }));
}

export async function exportCustomers(customers, seasonName = "All Seasons", format = "excel", filename = "MSBT_Customers") {
  if (!customers || customers.length === 0) return;

  const aoaData = [
    // Row 0: Header Row 1
    ["Name", "Entry Date", "Season Name", "Facility Details", "", "", "Total Revenue", "Total Paid", "Outstanding", "Last Edited By"],
    // Row 1: Header Row 2
    ["", "", "", "Trip", "Minute", "Trade", "", "", "", ""]
  ];

  customers.forEach(c => {
    aoaData.push([
      c.name,
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
      c.seasonName || seasonName,
      c.totalTrips || 0,
      c.totalMinutes || 0,
      c.totalTrades || 0,
      c.totalRevenue || 0,
      c.totalPaid || 0,
      c.outstanding || 0,
      c.lastEditedBy || "System"
    ]);
  });

  if (format === "excel") {
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet(aoaData);
      
      // Define merges
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Name
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Entry Date
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Season Name
        { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } }, // Facility Details merge (Trip, Minute, Trade)
        { s: { r: 0, c: 6 }, e: { r: 1, c: 6 } }, // Total Revenue
        { s: { r: 0, c: 7 }, e: { r: 1, c: 7 } }, // Total Paid
        { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } }, // Outstanding
        { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }  // Last Edited By
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (err) {
      console.error("Excel export failed:", err);
      throw err;
    }
  } else if (format === "csv") {
    // Generate 2-row header CSV
    const csvContent = aoaData.map(row => 
      row.map(val => {
        const valStr = String(val ?? "");
        return valStr.includes(",") ? `"${valStr}"` : valStr;
      }).join(",")
    ).join("\n");
    
    downloadBlob(new Blob([csvContent], { type: "text/csv" }), `${filename}.csv`);
  }
}
