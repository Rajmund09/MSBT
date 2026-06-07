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
    "Entry Date": new Date(c.created_at).toLocaleDateString(),
    "Season Name": seasonName,
    "Facility Details (Hour/Trip)": c.facilityDetails || "None",
    "Status": c.status,
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
