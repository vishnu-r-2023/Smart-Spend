import React from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Lightbulb,
  Calendar,
  Activity,
  Wallet,
  CreditCard,
  Target
} from "lucide-react";

const DashboardTab = ({
  totalIncome,
  totalExpenses,
  totalSavings,
  savingsRate,
  expenseChangePercent,
  transactions,
  insights,
  yearlyData,
  monthlyData,
  latestYear,
  categoryPercentageData,
  categoryData,
  savingsVsSpendingData,
  darkMode,
  COLORS,
  CustomTooltip
}) => {
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Income</div>
              <div className="stat-value">₹{totalIncome.toLocaleString()}</div>
              <div className="stat-change positive">
                <TrendingUp size={14} />
                <span>Stable</span>
              </div>
            </div>
            <div className="stat-icon income">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">₹{totalExpenses.toLocaleString()}</div>
              <div className={`stat-change ${expenseChangePercent > 0 ? "negative" : "positive"}`}>
                {expenseChangePercent > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{expenseChangePercent >= 0 ? "+" : ""}{expenseChangePercent.toFixed(1)}% vs last</span>
              </div>
            </div>
            <div className="stat-icon expense">
              <CreditCard size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Total Savings</div>
              <div className="stat-value">₹{totalSavings.toLocaleString()}</div>
              <div className="stat-change positive">
                <Target size={14} />
                <span>{savingsRate}% rate</span>
              </div>
            </div>
            <div className="stat-icon savings">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{transactions.length}</div>
              <div className="stat-change positive">
                <Activity size={14} />
                <span>All time</span>
              </div>
            </div>
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">
        <Lightbulb size={26} />
        AI Insights
      </div>
      <div className="insights-grid">
        {insights.map((insight, idx) => (
          <div key={idx} className={`insight-card ${insight.type}`}>
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-content">
              <h4>{insight.title}</h4>
              <p>{insight.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">
        <BarChart3 size={26} />
        Financial Analytics
      </div>

      <div className="chart-card full-width">
        <div className="chart-header">
          <div className="chart-title">
            <TrendingUp size={20} />
            Year-wise Financial Overview
          </div>
          <div className="chart-subtitle">Income, Expenses & Savings Trends</div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={yearlyData}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
            <XAxis dataKey="year" stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-md" />
            <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-md" />
            <Tooltip content={<CustomTooltip />} />
            <Legend className="chart-legend chart-legend-lg chart-legend-pad-20" />
            <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#incomeGrad)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#expenseGrad)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="savings" stroke="#F59E0B" fillOpacity={1} fill="url(#savingsGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Calendar size={18} />
              Monthly Income
            </div>
            <div className="chart-subtitle">Income trend ({latestYear})</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
              <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <TrendingDown size={18} />
              Monthly Expenses
            </div>
            <div className="chart-subtitle">Spending trend ({latestYear})</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
              <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: "#EF4444", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <PieIcon size={18} />
              Category Distribution
            </div>
            <div className="chart-subtitle">Spending by category</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryPercentageData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                labelLine={false}
              >
                {categoryPercentageData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                className="chart-legend chart-legend-sm"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart3 size={18} />
              Top Categories
            </div>
            <div className="chart-subtitle">Highest spending areas</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
              <XAxis dataKey="name" stroke={darkMode ? "#94A3B8" : "#64748B"} angle={-20} textAnchor="end" height={90} className="axis-xs" />
              <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {categoryData.slice(0, 6).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Target size={18} />
              Savings vs Expenses
            </div>
            <div className="chart-subtitle">Financial balance</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={savingsVsSpendingData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {savingsVsSpendingData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend className="chart-legend chart-legend-lg" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity size={18} />
              Monthly Savings
            </div>
            <div className="chart-subtitle">Savings trend ({latestYear})</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
              <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="savings" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card full-width">
        <div className="chart-header">
          <div className="chart-title">
            <BarChart3 size={20} />
            Income vs Expenses Comparison
          </div>
          <div className="chart-subtitle">Monthly overview ({latestYear})</div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"} />
            <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-md" />
            <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} className="axis-md" />
            <Tooltip content={<CustomTooltip />} />
            <Legend className="chart-legend chart-legend-lg chart-legend-pad-16" />
            <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default DashboardTab;
