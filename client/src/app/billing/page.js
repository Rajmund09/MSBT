"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Printer, Download, RefreshCw } from "lucide-react";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, FormField, Select, Skeleton } from "@/components/ui/index";

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }) : "—";

// Bill number generator
const getBillNo = (customerId, seasonId) =>
  `MSBT-${customerId?.slice(-4)?.toUpperCase()}-${seasonId?.slice(-4)?.toUpperCase()}-${Date.now().toString().slice(-5)}`;

export default function Billing() {
  const toast = useToast();
  const billRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getSeasons()
      .then(s => setSeasons(s))
      .catch(() => toast("Failed to load seasons", "error"));
  }, []);

  useEffect(() => {
    if (!selectedSeason) {
      setCustomers([]);
      setSelectedCustomer("");
      return;
    }
    api.getCustomers(selectedSeason)
      .then(c => {
        setCustomers(c);
        if (selectedCustomer && !c.some(cust => cust.id === selectedCustomer)) {
          setSelectedCustomer("");
        }
      })
      .catch(() => toast("Failed to load customers for the selected season", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason, toast]);

  const loadBill = useCallback(async () => {
    if (!selectedCustomer || !selectedSeason) return;
    setLoading(true);
    try {
      const [customer, entries, payments] = await Promise.all([
        api.getCustomer(selectedCustomer),
        api.getEntries({ customerId: selectedCustomer, seasonId: selectedSeason }),
        api.getPayments({ customerId: selectedCustomer, seasonId: selectedSeason }),
      ]);
      const season = seasons.find(s => s.id === selectedSeason);
      const totalRevenue = entries.reduce((s, e) => s + (Number(e.total_amount) || 0), 0);
      const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      setBillData({
        customer: customer.customer,
        season,
        entries,
        payments,
        totalRevenue,
        totalPaid,
        outstanding: totalRevenue - totalPaid,
        billNo: getBillNo(selectedCustomer, selectedSeason),
        billDate: new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" }),
      });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCustomer, selectedSeason, seasons, toast]);

  useEffect(() => { loadBill(); }, [loadBill]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(billRef.current, {
        scale: 2,
        backgroundColor: "#fff",
        useCORS: true,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`MSBT_Bill_${billData?.billNo || "bill"}.pdf`);
      toast("PDF downloaded", "success");
    } catch (err) {
      toast("PDF generation failed: " + err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const COMPANY = {
    name: "Mahalaxmi SB Traders",
    tagline: "Agricultural Trading & Services",
    address: "Kalahandi, Odisha",
    phone: "Contact: +91 9556644965",
  };

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #bill-print-area, #bill-print-area * { visibility: visible !important; }
          #bill-print-area { position: fixed !important; top: 0; left: 0; width: 100%; background: white !important; }
        }
      `}</style>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 sm:px-6 md:px-12"
      >
        <PageHeader title="Billing" description="Generate & download customer bills" />

        {/* Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-xl">
          <FormField label="Customer">
            <Select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.village}</option>)}
            </Select>
          </FormField>
          <FormField label="Season">
            <Select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
              <option value="">Select season…</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
        </div>

        {loading ? (
          <Skeleton className="h-[600px]" />
        ) : !billData ? (
          <div className="flex items-center justify-center h-64 rounded-3xl border-2 border-dashed border-[var(--border)]">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-3 text-[var(--fg-muted)] opacity-30" />
              <p className="font-mono text-xs text-[var(--fg-muted)] uppercase tracking-widest">
                Select a customer and season to generate a bill
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 print:hidden no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-5 rounded-xl border border-[var(--border)] font-mono text-xs uppercase tracking-widest hover:bg-[var(--fg)]/5 transition-all"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-5 rounded-xl bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                {generating ? "Generating…" : "Download PDF"}
              </button>
            </div>

            {/* Bill Preview */}
            <div
              id="bill-print-area"
              ref={billRef}
              className="bg-[#ffffff] text-[#000000] rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-8 md:p-10 max-w-3xl mx-auto"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {/* Devotional Top Header */}
              <div className="text-center mb-6 border-b border-dashed border-[#e5e7eb] pb-2 text-[#dc2626] font-bold tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 select-none">
                <span className="text-[#ea580c]">✿</span>
                <span>॥ जय श्री श्याम ॥</span>
                <span className="text-[#ea580c]">✿</span>
              </div>

              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 border-b-2 border-[#000000] pb-6 sm:pb-8 mb-6 sm:mb-8">
                <div>
                  <div className="text-2xl sm:text-4xl font-bold tracking-tighter mb-1">MSBT</div>
                  <div className="text-xs sm:text-sm font-bold">{COMPANY.name}</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280] mt-1">{COMPANY.tagline}</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280]">{COMPANY.address}</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280]">{COMPANY.phone}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[10px] sm:text-xs text-[#9ca3af] uppercase tracking-widest mb-1">Invoice</div>
                  <div className="text-sm sm:text-lg font-mono font-bold">{billData.billNo}</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280] mt-2">Date: {billData.billDate}</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280]">Season: {billData.season?.name}</div>
                </div>
              </div>

              {/* Customer */}
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-2">Bill To</div>
                <div className="text-xl font-bold">{billData.customer.name}</div>
                <div className="text-sm text-[#4b5563]">{billData.customer.phone}</div>
                <div className="text-sm text-[#4b5563]">{billData.customer.village}</div>
                {billData.customer.address && <div className="text-xs text-[#6b7280]">{billData.customer.address}</div>}
              </div>

              {/* Entries */}
              {billData.entries.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <div className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-3">Services Rendered</div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs min-w-[480px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-[#e5e7eb]">
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Type</th>
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Date</th>
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af] hidden sm:table-cell">Description</th>
                          <th className="text-right py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Qty</th>
                          <th className="text-right py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Rate</th>
                          <th className="text-right py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billData.entries.map((e, i) => (
                          <tr key={e.id} className={`border-b border-[#f3f4f6] ${i % 2 === 0 ? "bg-[#f9fafb]" : ""}`}>
                            <td className="py-2 font-mono">{e.entry_type}</td>
                            <td className="py-2 font-mono">{fmtDate(e.entry_date)}</td>
                            <td className="py-2 font-mono text-[#4b5563] hidden sm:table-cell">{e.description || "—"}</td>
                            <td className="py-2 font-mono text-right">{e.quantity}</td>
                            <td className="py-2 font-mono text-right">{fmt(e.rate)}</td>
                            <td className="py-2 font-mono text-right font-bold">{fmt(e.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payments */}
              {billData.payments.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <div className="text-[10px] uppercase tracking-widest text-[#9ca3af] mb-3">Payments Received</div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs min-w-[320px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-[#e5e7eb]">
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Date</th>
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Mode</th>
                          <th className="text-left py-2 font-mono uppercase tracking-wider text-[#9ca3af] hidden sm:table-cell">Reference</th>
                          <th className="text-right py-2 font-mono uppercase tracking-wider text-[#9ca3af]">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billData.payments.map((p, i) => (
                          <tr key={p.id} className={`border-b border-[#f3f4f6] ${i % 2 === 0 ? "bg-[#f9fafb]" : ""}`}>
                            <td className="py-2 font-mono">{fmtDate(p.payment_date)}</td>
                            <td className="py-2 font-mono">{p.payment_mode}</td>
                            <td className="py-2 font-mono text-[#4b5563] hidden sm:table-cell">{p.reference_no || "—"}</td>
                            <td className="py-2 font-mono text-right text-[#15803d] font-bold">{fmt(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t-2 border-[#000000] pt-6 flex justify-end">
                <div className="w-full sm:w-64">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-[#4b5563]">Total Charges</span>
                    <span className="font-mono">{fmt(billData.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-[#4b5563]">Total Paid</span>
                    <span className="font-mono text-[#15803d]">{fmt(billData.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-[#000000] mt-2 text-base font-bold">
                    <span>Balance Due</span>
                    <span className={`font-mono ${billData.outstanding > 0 ? "text-[#b91c1c]" : "text-[#15803d]"}`}>
                      {fmt(billData.outstanding)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-10 sm:mt-16 pt-6 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                <div>
                  <div className="w-32 border-b border-[#9ca3af] mb-1" />
                  <div className="text-[10px] text-[#9ca3af] uppercase tracking-widest">Customer Signature</div>
                </div>
                <div className="sm:text-right flex flex-col sm:items-end gap-1">
                  <div className="h-12 w-32 relative my-1 flex sm:justify-end justify-start">
                    <img src="/signature.png" alt="Authorised Signature" className="h-full object-contain" />
                  </div>
                  <div className="text-[10px] text-[#9ca3af] uppercase tracking-widest">Authorised Signature</div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center text-[10px] text-[#d1d5db] uppercase tracking-widest">
                Generated by MSBT Business Operating System · {billData.billDate}
              </div>
            </div>
          </>
        )}
      </motion.main>
    </>
  );
}
