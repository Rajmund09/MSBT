"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Skeleton, Select } from "@/components/ui/index";
import { BarChart2 } from "lucide-react";

const COLORS = ["#818cf8", "#a78bfa", "#fb923c", "#34d399", "#f43f5e", "#06b6d4", "#eab308"];
const THEME_COLORS = { Trip: "#818cf8", Hour: "#c084fc", Minute: "#a78bfa", Trade: "#fb923c" };

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtShort = (n) => {
  n = Number(n || 0);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] rounded-xl px-4 py-3 text-xs font-mono shadow-xl">
      <p className="text-[var(--fg-muted)] mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current" />
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, children, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 rounded-3xl bg-[var(--fg)]/[0.025] border border-[var(--border)] flex flex-col gap-5"
    >
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-[var(--fg-muted)]">{title}</h3>
      {loading ? <Skeleton className="h-60" /> : children}
    </motion.div>
  );
}

export default function Analytics() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");

  useEffect(() => {
    api.getSeasons().then(setSeasons).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getAnalytics(selectedSeason ? { seasonId: selectedSeason } : {})
      .then(d => {
        // Coerce numerical values returned as strings by PostgreSQL pg client
        if (d) {
          if (d.byType) {
            d.byType = d.byType.map(x => ({ ...x, value: Number(x.value) || 0 }));
          }
          if (d.revenueByMonth) {
            d.revenueByMonth = d.revenueByMonth.map(x => ({ ...x, value: Number(x.value) || 0 }));
          }
          if (d.collectionsByMonth) {
            d.collectionsByMonth = d.collectionsByMonth.map(x => ({ ...x, value: Number(x.value) || 0 }));
          }
          if (d.topCustomers) {
            d.topCustomers = d.topCustomers.map(x => ({
              ...x,
              revenue: Number(x.revenue) || 0,
              paid: Number(x.paid) || 0
            }));
          }
          if (d.seasonStats) {
            d.seasonStats = d.seasonStats.map(x => ({
              ...x,
              revenue: Number(x.revenue) || 0,
              paid: Number(x.paid) || 0
            }));
          }
        }
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        toast(err.message, "error");
        setLoading(false);
      });
  }, [selectedSeason]);

  const monthFmt = (m) => {
    if (!m) return "";
    const [y, mo] = m.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(mo) - 1]} '${y.slice(2)}`;
  };

  // Merge revenue + collections by month
  const trendData = (() => {
    if (!data) return [];
    const map = {};
    (data.revenueByMonth || []).forEach(r => {
      map[r.month] = { month: monthFmt(r.month), revenue: r.value };
    });
    (data.collectionsByMonth || []).forEach(r => {
      if (map[r.month]) map[r.month].collections = r.value;
      else map[r.month] = { month: monthFmt(r.month), collections: r.value };
    });
    return Object.values(map);
  })();

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 sm:px-6 md:px-12"
    >
      <PageHeader
        title="Analytics"
        description="Business intelligence & performance metrics"
        action={
          <Select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="w-48 h-10"
          >
            <option value="">All Seasons</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Revenue vs Collections Trend */}
        <ChartCard title="Revenue vs Collections (Monthly)" loading={loading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--fg)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--fg)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: "var(--fg-muted)", fontSize: 10, fontFamily: "monospace" }} />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 10, fontFamily: "monospace" }} tickFormatter={fmtShort} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--fg)" strokeWidth={1.5} fill="url(#gRev)" />
              <Area type="monotone" dataKey="collections" name="Collected" stroke="#10b981" strokeWidth={1.5} fill="url(#gCol)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* By Entry Type */}
        <ChartCard title="Revenue by Entry Type" loading={loading}>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-full sm:w-1/2 h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.byType || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={38}
                    strokeWidth={0}
                  >
                    {(data?.byType || []).map((entry, i) => (
                      <Cell key={i} fill={THEME_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-row sm:flex-col gap-3 sm:gap-3 flex-wrap justify-center sm:justify-start shrink-0 w-full sm:w-1/2">
              {(data?.byType || []).map((t, i) => (
                <div key={t.name} className="flex items-center justify-between gap-3 w-[120px] sm:w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: THEME_COLORS[t.name] || COLORS[i % COLORS.length] }} />
                    <span className="font-mono text-xs text-[var(--fg-muted)] truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-xs shrink-0">{fmtShort(t.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        {/* Top Customers */}
        <ChartCard title="Top 10 Customers by Revenue" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={(data?.topCustomers || []).map(c => ({ name: c.name.split(" ")[0], revenue: c.revenue, paid: c.paid }))} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--fg-muted)", fontSize: 9, fontFamily: "monospace" }} tickFormatter={fmtShort} />
              <YAxis type="category" dataKey="name" tick={{ fill: "var(--fg)", fontSize: 9, fontFamily: "monospace" }} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--fg)" fillOpacity={0.12} radius={[0, 4, 4, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#10b981" fillOpacity={0.4} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Season Comparison */}
        <ChartCard title="Season Comparison" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={(data?.seasonStats || []).map(s => ({ name: s.name.split(" ").slice(0,2).join(" "), revenue: s.revenue, paid: s.paid }))} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: "var(--fg-muted)", fontSize: 8, fontFamily: "monospace" }} />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 9, fontFamily: "monospace" }} tickFormatter={fmtShort} width={42} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--fg)" fillOpacity={0.12} radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid" fill="#10b981" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.main>
  );
}
