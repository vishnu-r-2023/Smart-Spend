import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, BarChart3, Lightbulb, Calendar, Filter, Moon, Sun, Activity, Wallet, CreditCard, Target } from 'lucide-react';

const SmartSpend = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    const [d1, m1, y1] = a.date.split("/").map(Number);
    const [d2, m2, y2] = b.date.split("/").map(Number);
    const dateA = new Date(y1, m1 - 1, d1);
    const dateB = new Date(y2, m2 - 1, d2);
    return dateB - dateA;
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/transactions");
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Backend not reachable");
        setError("Backend not reachable");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Calculate statistics
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0;

  const getCategoryFromDescription = (desc = "") => {
    const d = desc.toLowerCase();
    if (d.includes("zomato") || d.includes("swiggy") || d.includes("restaurant") || d.includes("pizza") || d.includes("coffee"))
      return "Food & Dining";
    if (d.includes("uber") || d.includes("ola") || d.includes("metro") || d.includes("petrol"))
      return "Transportation";
    if (d.includes("amazon") || d.includes("flipkart") || d.includes("shopping"))
      return "Shopping";
    if (d.includes("netflix") || d.includes("spotify") || d.includes("prime"))
      return "Subscriptions";
    if (d.includes("electricity") || d.includes("mobile") || d.includes("bill"))
      return "Utilities";
    if (d.includes("gym") || d.includes("health"))
      return "Health";
    if (d.includes("sip") || d.includes("mutual fund") || d.includes("investment"))
      return "Savings";
    if (d.includes("salary") || d.includes("bonus"))
      return "Income";
    return "Others";
  };

  // Category breakdown
  const categoryData = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      const category = getCategoryFromDescription(t.description);
      const existing = acc.find(item => item.name === category);
      if (existing) {
        existing.value += Math.abs(t.amount);
      } else {
        acc.push({ name: category, value: Math.abs(t.amount) });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

  // Year-wise aggregation
  const yearlyData = Object.values(
    transactions.reduce((acc, tx) => {
      if (!tx.date) return acc;
      const [day, month, year] = tx.date.split("/");
      const yearKey = year;
      if (!acc[yearKey]) {
        acc[yearKey] = { year: yearKey, income: 0, expenses: 0, savings: 0 };
      }
      if (tx.amount > 0) {
        acc[yearKey].income += tx.amount;
      } else {
        acc[yearKey].expenses += Math.abs(tx.amount);
      }
      acc[yearKey].savings = acc[yearKey].income - acc[yearKey].expenses;
      return acc;
    }, {})
  ).sort((a, b) => a.year - b.year);

  // Get latest year
  const years = transactions
    .map(tx => {
      if (!tx.date) return null;
      const [d, m, y] = tx.date.split("/");
      return Number(y);
    })
    .filter(Boolean);
  const latestYear = years.length ? Math.max(...years) : null;

  // Monthly data
  const monthlyData = Object.values(
    transactions.reduce((acc, tx) => {
      if (!tx.date) return acc;
      const [day, month, year] = tx.date.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date)) return acc;
      const monthIndex = date.getMonth();
      const key = `${year}-${monthIndex}`;
      if (!acc[key]) {
        acc[key] = {
          year: Number(year),
          monthIndex,
          month: date.toLocaleString("default", { month: "short" }),
          label: `${date.toLocaleString("default", { month: "short" })} ${year}`,
          income: 0,
          expenses: 0,
          savings: 0
        };
      }
      if (tx.amount > 0) {
        acc[key].income += tx.amount;
      } else {
        acc[key].expenses += Math.abs(tx.amount);
      }
      acc[key].savings = acc[key].income - acc[key].expenses;
      return acc;
    }, {})
  ).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex
  );

  // Expense change calculation
  const sortedMonthly = [...monthlyData].sort(
    (a, b) => (a.year - b.year) || (a.monthIndex - b.monthIndex)
  );
  const currentMonth = sortedMonthly[sortedMonthly.length - 1];
  const previousMonth = sortedMonthly[sortedMonthly.length - 2];
  const currentExpenses = currentMonth?.expenses || 0;
  const previousExpenses = previousMonth?.expenses || 0;
  let expenseChangePercent = 0;
  if (previousExpenses > 0) {
    expenseChangePercent = ((currentExpenses - previousExpenses) / previousExpenses) * 100;
  }

  // Category percentage data
  const totalCategoryExpenses = categoryData.reduce((sum, cat) => sum + cat.value, 0);
  const categoryPercentageData = categoryData.map(cat => ({
    ...cat,
    percentage: ((cat.value / totalCategoryExpenses) * 100).toFixed(1)
  }));

  // Savings vs Spending comparison
  const savingsVsSpendingData = [
    { name: 'Savings', value: totalSavings > 0 ? totalSavings : 0, fill: '#10B981' },
    { name: 'Expenses', value: totalExpenses, fill: '#EF4444' }
  ];

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6', '#F97316'];

  const insights = [
    {
      icon: '🍔',
      title: 'Dining Analysis',
      description: `Food & Dining: ₹${categoryData.find(c => c.name === 'Food & Dining')?.value.toLocaleString() || 0} this period`,
      type: 'warning'
    },
    {
      icon: '💰',
      title: 'Savings Performance',
      description: `You saved ${savingsRate}% of your income. ${savingsRate > 50 ? 'Excellent!' : 'Room for improvement.'}`,
      type: 'success'
    },
    {
      icon: '📊',
      title: 'Top Category',
      description: `${categoryData[0]?.name || 'N/A'}: ₹${categoryData[0]?.value.toLocaleString() || 0} (highest)`,
      type: 'info'
    },
    {
      icon: '🎯',
      title: 'Optimization Tip',
      description: 'Focus on top 3 categories to unlock ₹10,000+ monthly savings',
      type: 'tip'
    }
  ];

  const handleFileUpload = async () => {
    if (!selectedFile) return alert("Please select a file");
    const formData = new FormData();
    formData.append("statement", selectedFile);
    try {
      setUploading(true);
      const res = await fetch("http://localhost:5000/api/upload-statement", {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const txRes = await fetch("http://localhost:5000/api/transactions");
      const txData = await txRes.json();
      setTransactions(txData);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err) {
      alert("Upload failed. Check backend.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: darkMode ? 'rgba(17, 24, 39, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          padding: '14px 18px',
          borderRadius: '10px',
          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ 
            fontWeight: '700', 
            marginBottom: '10px', 
            color: darkMode ? '#F9FAFB' : '#111827',
            fontSize: '14px'
          }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color, 
              fontSize: '13px', 
              margin: '6px 0',
              fontWeight: '600'
            }}>
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app-container {
          min-height: 100vh;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .app-container.light {
          background: #F8FAFC;
          color: #1E293B;
        }

        .app-container.dark {
          background: #0F172A;
          color: #F1F5F9;
        }

        /* ===== HEADER ===== */
        .header {
          background: ${darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'};
          padding: 20px 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: ${darkMode ? '0 1px 3px rgba(0, 0, 0, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.05)'};
        }

        .header-content {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .logo {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 800;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 12px;
          font-weight: 500;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          letter-spacing: 0.3px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: none;
          background: ${darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(99, 102, 241, 0.08)'};
          color: ${darkMode ? '#E2E8F0' : '#6366F1'};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .icon-btn:hover {
          background: ${darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.15)'};
          transform: translateY(-1px);
        }

        .icon-btn:active {
          transform: translateY(0);
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 1440px;
          margin: 0 auto;
          padding: 32px;
          padding-bottom: 120px;
        }

        /* ===== STATS CARDS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: ${darkMode ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 1)'};
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366F1, #8B5CF6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: ${darkMode 
            ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
            : '0 12px 32px rgba(99, 102, 241, 0.1)'};
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .stat-icon.income {
          background: linear-gradient(135deg, #10B981 0%, #14B8A6 100%);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .stat-icon.expense {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .stat-icon.savings {
          background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .stat-label {
          font-size: 13px;
          font-weight: 600;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 10px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .stat-change {
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .stat-change.positive {
          color: #10B981;
        }

        .stat-change.negative {
          color: #EF4444;
        }

        /* ===== INSIGHTS ===== */
        .section-title {
          font-size: 22px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
          margin-bottom: 32px;
        }

        .insight-card {
          background: ${darkMode ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 1)'};
          border-radius: 14px;
          padding: 20px;
          display: flex;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
        }

        .insight-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          border-radius: 14px 0 0 14px;
          transition: width 0.3s ease;
        }

        .insight-card.warning::before { background: #EF4444; }
        .insight-card.success::before { background: #10B981; }
        .insight-card.info::before { background: #3B82F6; }
        .insight-card.tip::before { background: #F59E0B; }

        .insight-card:hover {
          transform: translateX(4px);
          box-shadow: ${darkMode 
            ? '0 8px 24px rgba(0, 0, 0, 0.3)' 
            : '0 8px 24px rgba(0, 0, 0, 0.06)'};
        }

        .insight-card:hover::before {
          width: 6px;
        }

        .insight-icon {
          font-size: 36px;
          flex-shrink: 0;
          line-height: 1;
        }

        .insight-content h4 {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .insight-content p {
          font-size: 13px;
          line-height: 1.6;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        /* ===== CHARTS ===== */
        .charts-section {
          margin-bottom: 32px;
        }

        .charts-grid {
          display: grid;
          gap: 24px;
        }

        .chart-card {
          background: ${darkMode ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 1)'};
          border-radius: 16px;
          padding: 28px;
          transition: all 0.3s ease;
        }

        .chart-card:hover {
          box-shadow: ${darkMode 
            ? '0 12px 32px rgba(0, 0, 0, 0.3)' 
            : '0 12px 32px rgba(0, 0, 0, 0.06)'};
        }

        .chart-card.full-width {
          grid-column: 1 / -1;
          margin-bottom: 32px;
        }

        .charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(480px, 1fr));
          margin-bottom: 32px;
          gap: 24px;
        }

        .chart-header {
          margin-bottom: 24px;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chart-subtitle {
          font-size: 13px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          font-weight: 500;
        }

        /* ===== TRANSACTIONS ===== */
        .category-filters {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 16px;
          margin-bottom: 24px;
          scrollbar-width: none;
        }

        .category-filters::-webkit-scrollbar {
          display: none;
        }

        .filter-chip {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 1)'};
          background: ${darkMode ? 'rgba(51, 65, 85, 0.3)' : '#FFFFFF'};
          color: ${darkMode ? '#E2E8F0' : '#475569'};
        }

        .filter-chip:hover {
          border-color: #6366F1;
          background: ${darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'};
        }

        .filter-chip.active {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          border-color: transparent;
        }

        .transaction-list {
          display: grid;
          gap: 12px;
        }

        .transaction-item {
          background: ${darkMode ? 'rgba(30, 41, 59, 0.4)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 1)'};
          border-radius: 12px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .transaction-item:hover {
          transform: translateY(-2px);
          box-shadow: ${darkMode 
            ? '0 6px 20px rgba(0, 0, 0, 0.3)' 
            : '0 6px 20px rgba(0, 0, 0, 0.05)'};
          border-color: ${darkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'};
        }

        .transaction-left {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .transaction-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .transaction-details h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .transaction-details p {
          font-size: 12px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .transaction-amount {
          text-align: right;
        }

        .transaction-amount .amount {
          font-size: 17px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 4px;
        }

        .transaction-amount .amount.positive {
          color: #10B981;
        }

        .transaction-amount .amount.negative {
          color: #EF4444;
        }

        .transaction-amount .category {
          font-size: 11px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'};
          padding: 16px 24px 24px;
          display: flex;
          justify-content: center;
          gap: 8px;
          box-shadow: ${darkMode ? '0 -4px 24px rgba(0, 0, 0, 0.4)' : '0 -4px 24px rgba(0, 0, 0, 0.04)'};
          z-index: 999;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 10px 20px;
          border-radius: 12px;
          min-width: 85px;
        }

        .nav-item:hover {
          background: ${darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'};
        }

        .nav-item.active {
          background: ${darkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'};
        }

        .nav-icon {
          transition: all 0.2s ease;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .nav-item.active .nav-icon {
          color: #6366F1;
          transform: translateY(-2px);
        }

        .nav-label {
          font-size: 12px;
          font-weight: 600;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          transition: all 0.2s ease;
        }

        .nav-item.active .nav-label {
          color: #6366F1;
        }

        /* ===== MODAL ===== */
        .upload-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .upload-content {
          width: 90%;
          max-width: 500px;
          background: ${darkMode ? '#1E293B' : '#FFFFFF'};
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .upload-header {
          font-size: 24px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 24px;
          text-align: center;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .upload-zone {
          border: 2px dashed ${darkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)'};
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 20px;
        }

        .upload-zone:hover {
          border-color: #6366F1;
          background: ${darkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)'};
        }

        .upload-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .upload-text {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .upload-hint {
          font-size: 14px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .format-tags {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .format-tag {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: ${darkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)'};
          color: #6366F1;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn {
          padding: 14px;
          border-radius: 12px;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: ${darkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 1)'};
          color: ${darkMode ? '#E2E8F0' : '#475569'};
        }

        .btn-secondary:hover {
          background: ${darkMode ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 1)'};
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .main-content {
            padding: 20px 16px 120px;
          }

          .charts-row {
            grid-template-columns: 1fr;
          }

          .header-content {
            padding: 0 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stat-value {
            font-size: 24px;
          }

          .section-title {
            font-size: 20px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header">
  <div className="header-content">
    <div className="logo-section">
      <div className="logo">SmartSpend</div>
      <div className="tagline">AI-Powered Finance Tracker</div>

      <div className="greeting">
        <span className="greeting-text">Welcome back,</span>
        <span className="greeting-name"> Vishnu 😃</span>
      </div>
    </div>

    <div className="header-actions">
      <button
        className="icon-btn"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <button
        className="icon-btn"
        onClick={() => setShowUploadModal(true)}
        title="Upload statement"
      >
        <Upload size={20} />
          </button>
        </div>
      </div>
    </div>


      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
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
                    <div className={`stat-change ${expenseChangePercent > 0 ? 'negative' : 'positive'}`}>
                      {expenseChangePercent > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{expenseChangePercent >= 0 ? '+' : ''}{expenseChangePercent.toFixed(1)}% vs last</span>
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

            {/* AI Insights */}
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

            {/* Charts */}
            <div className="section-title">
              <BarChart3 size={26} />
              Financial Analytics
            </div>

            {/* Year-wise Overview */}
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
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                  <XAxis dataKey="year" stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '13px', fontWeight: 500 }} />
                  <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '13px', fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 600 }} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#incomeGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#expenseGrad)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="savings" stroke="#F59E0B" fillOpacity={1} fill="url(#savingsGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trends */}
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
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                    <XAxis dataKey="label" stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                    <XAxis dataKey="label" stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: '#EF4444', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Analysis */}
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
                      wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
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
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} angle={-20} textAnchor="end" height={90} style={{ fontSize: '11px' }} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
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

            {/* Comparative */}
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
                    <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                    <XAxis dataKey="label" stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="savings" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income vs Expenses */}
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
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)'} />
                  <XAxis dataKey="label" stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '13px', fontWeight: 500 }} />
                  <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} style={{ fontSize: '13px', fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '13px', fontWeight: 600 }} />
                  <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <>
            <div className="section-title">
              <Calendar size={26} />
              Transaction History
            </div>
            
            <div className="category-filters">
              {['All', 'Food & Dining', 'Transportation', 'Shopping', 'Subscriptions', 'Utilities', 'Savings', 'Health'].map(cat => (
                <div
                  key={cat}
                  className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>

            <div className="chart-card">
              <div className="transaction-list">
                {sortedTransactions
                  .filter(t => selectedCategory === 'All' || getCategoryFromDescription(t.description) === selectedCategory)
                  .map(tx => {
                    const category = getCategoryFromDescription(tx.description);
                    const icons = {
                      'Food & Dining': '🍔', 'Transportation': '🚗', 'Shopping': '🛍️',
                      'Subscriptions': '📺', 'Utilities': '💡', 'Savings': '💰',
                      'Health': '🏋️', 'Income': '💵', 'Others': '💳'
                    };
                    return (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-left">
                          <div className="transaction-icon" style={{
                            background: tx.amount > 0
                              ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                          }}>
                            {icons[category]}
                          </div>
                          <div className="transaction-details">
                            <h4>{tx.description}</h4>
                            <p>{tx.date}</p>
                          </div>
                        </div>
                        <div className="transaction-amount">
                          <div className={`amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                            {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                          </div>
                          <div className="category">{category}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {activeTab === 'insights' && (
          <>
            <div className="section-title">
              <Lightbulb size={26} />
              Insights & Recommendations
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

            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-title">Financial Health Score</div>
                <div className="chart-subtitle">Based on savings rate and spending patterns</div>
              </div>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ 
                  fontSize: '72px', 
                  fontWeight: '800', 
                  fontFamily: 'Outfit',
                  background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent' 
                }}>
                  {Math.round(Math.min(100, savingsRate * 1.2))}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '12px', color: darkMode ? '#94A3B8' : '#64748B' }}>
                  {savingsRate > 60 ? '🎉 Excellent' : savingsRate > 40 ? '👍 Good' : savingsRate > 20 ? '📈 Fair' : '⚠️ Needs Work'}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <div className="section-title">Profile & Settings</div>
            <div className="chart-card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>👤</div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'Outfit', marginBottom: '8px' }}>Vishnu Ramesh</h2>
              <p style={{ color: darkMode ? '#94A3B8' : '#64748B', marginBottom: '40px', fontSize: '15px' }}>vishnuramesh0777@gmail.com</p>
              
              <div style={{ display: 'grid', gap: '14px', maxWidth: '400px', margin: '0 auto' }}>
                <button className="btn btn-primary">Account Settings</button>
                <button className="btn btn-secondary">Privacy & Security</button>
                <button className="btn btn-secondary">Export Data</button>
                <button className="btn btn-secondary" style={{ color: '#EF4444', fontWeight: 700 }}>Logout</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <PieIcon size={22} className="nav-icon" />
          <span className="nav-label">Dashboard</span>
        </div>
        <div className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
          <Calendar size={22} className="nav-icon" />
          <span className="nav-label">Transactions</span>
        </div>
        <div className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
          <Lightbulb size={22} className="nav-icon" />
          <span className="nav-label">Insights</span>
        </div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Filter size={22} className="nav-icon" />
          <span className="nav-label">Profile</span>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="upload-modal" onClick={() => setShowUploadModal(false)}>
          <div className="upload-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="upload-header">Upload Bank Statement</h2>
            <div className="upload-zone" onClick={() => document.getElementById("fileInput").click()}>
              <input
                type="file"
                accept=".pdf,.csv,.xls,.xlsx"
                style={{ display: "none" }}
                id="fileInput"
                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              />
              <div className="upload-icon">
                <Upload size={40} />
              </div>
              <div className="upload-text">Click to upload or drag & drop</div>
              <div className="upload-hint">Secure & encrypted</div>
              {selectedFile && (
                <div style={{ marginTop: "16px", fontSize: "14px", fontWeight: '600', color: '#6366F1' }}>
                  📄 {selectedFile.name}
                </div>
              )}
            </div>
            <div className="format-tags">
              <span className="format-tag">PDF</span>
              <span className="format-tag">CSV</span>
              <span className="format-tag">XLS</span>
              <span className="format-tag">XLSX</span>
            </div>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFileUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSpend;
