import { useState, useEffect } from 'react';
import API from '../../api/axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics/stats').then(res => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!stats) return <div className="empty-state"><p>No data available.</p></div>;

  const statusData = [
    { name: 'Received', value: stats.received, color: '#f59e0b' },
    { name: 'In Progress', value: stats.inProgress, color: '#6366f1' },
    { name: 'Resolved', value: stats.resolved, color: '#22c55e' },
  ];

  const areaChartData = stats.areaStats.slice(0, 10).map(a => ({
    name: a._id.length > 15 ? a._id.slice(0, 15) + '…' : a._id,
    fullName: a._id,
    Total: a.total,
    Resolved: a.resolved,
    'In Progress': a.inProgress,
    Received: a.received,
    Rate: a.total ? Math.round((a.resolved / a.total) * 100) : 0,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Real-time complaint statistics</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><FileText size={24} className="stat-icon blue" /><div><span className="stat-num">{stats.total}</span><p>Total Complaints</p></div></div>
        <div className="stat-card"><AlertCircle size={24} className="stat-icon orange" /><div><span className="stat-num">{stats.received}</span><p>Received</p></div></div>
        <div className="stat-card"><Clock size={24} className="stat-icon purple" /><div><span className="stat-num">{stats.inProgress}</span><p>In Progress</p></div></div>
        <div className="stat-card"><CheckCircle size={24} className="stat-icon green" /><div><span className="stat-num">{stats.resolved}</span><p>Resolved</p></div></div>
      </div>

      <div className="charts-grid">
        {/* Status Distribution Pie */}
        <div className="chart-card">
          <h3>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Bar Chart */}
        <div className="chart-card">
          <h3>Category-wise Complaints</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.categoryStats.map(c => ({ name: c._id.length > 12 ? c._id.slice(0,12)+'…' : c._id, fullName: c._id, count: c.count }))} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v, n, { payload }) => [v, payload.fullName]} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {stats.categoryStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area-wise stacked bar */}
        <div className="chart-card chart-wide">
          <h3>Area-wise Complaints (Top 10)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={areaChartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v, n, { payload }) => [v, `${payload.fullName} – ${n}`]} />
              <Legend />
              <Bar dataKey="Resolved" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
              <Bar dataKey="In Progress" stackId="a" fill="#6366f1" />
              <Bar dataKey="Received" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area resolution rate */}
        <div className="chart-card chart-wide">
          <h3>Area-wise Resolution Rate (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={areaChartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v, _, { payload }) => [`${v}%`, `${payload.fullName} resolution rate`]} />
              <Bar dataKey="Rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
