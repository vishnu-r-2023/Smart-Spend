import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, BarChart3, Lightbulb, Calendar, Filter, Moon, Sun, Activity, Wallet, CreditCard, Target, Plus, LogOut, User, Settings, Shield, Bell, Key, Sparkles, Tags, Camera } from 'lucide-react';

const SmartSpend = () => {
  const API_BASE = process.env.REACT_APP_API_BASE || "https://smart-spend-ho8v.onrender.com/api";
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: "expense",
    amount: "",
    category: "Food & Dining",
    date: "",
    paymentMethod: "UPI",
    notes: ""
  });
  const [entryErrors, setEntryErrors] = useState({});
  const [entrySubmitting, setEntrySubmitting] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState("");

  const [authStatus, setAuthStatus] = useState("checking");
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authProcessing, setAuthProcessing] = useState(false);

  const [profileSection, setProfileSection] = useState("overview");
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", avatarUrl: "" });
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [notificationForm, setNotificationForm] = useState({
    weeklySummary: true,
    budgetAlerts: true,
    productUpdates: true
  });
  const [preferenceForm, setPreferenceForm] = useState({
    currency: "INR",
    categoryPrefs: []
  });
  const [profileNotice, setProfileNotice] = useState(null);
  const [accountNotice, setAccountNotice] = useState(null);
  const [securityNotice, setSecurityNotice] = useState(null);
  const [prefsNotice, setPrefsNotice] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const isAuthenticated = authStatus === "authenticated";

  const categoryOptions = [
    "Food & Dining",
    "Transportation",
    "Rent",
    "Shopping",
    "Travel",
    "Subscriptions",
    "Utilities",
    "Savings",
    "Health",
    "Entertainment",
    "Education",
    "Income",
    "Others"
  ];

  const categoryFilters = ["All", ...categoryOptions];

  const paymentOptions = ["UPI", "Card", "Cash", "Bank Transfer", "Wallet", "Cheque"];

  const currencyOptions = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD"];

  const profileSections = [
    { id: "overview", label: "Overview", icon: User },
    { id: "edit", label: "Edit Profile", icon: Camera },
    { id: "account", label: "Account Settings", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Data & Preferences", icon: Tags }
  ];

  const authHighlights = [
    {
      icon: Sparkles,
      title: "Expense tracking & analytics",
      description: "Automated and manual entries flow into clear charts."
    },
    {
      icon: PieIcon,
      title: "Year & category insights",
      description: "Instant breakdowns of spending patterns and trends."
    },
    {
      icon: Target,
      title: "Savings visualization",
      description: "Track goals with monthly and yearly comparisons."
    },
    {
      icon: Shield,
      title: "Secure accounts",
      description: "Token-based sessions protect every update."
    }
  ];
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    const [d1, m1, y1] = a.date.split("/").map(Number);
    const [d2, m2, y2] = b.date.split("/").map(Number);
    const dateA = new Date(y1, m1 - 1, d1);
    const dateB = new Date(y2, m2 - 1, d2);
    return dateB - dateA;
  });

  const fetchTransactions = async (token) => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch transactions");
      }
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

  const fetchProfile = async (token) => {
    if (!token) return;
    try {
      setProfileLoading(true);
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Failed to fetch profile");
      }
      const data = await res.json();
      if (data?.user) {
        setProfileData(data.user);
        setUser(data.user);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("smartspend_token");
      if (!storedToken) {
        setAuthToken(null);
        setUser(null);
        setAuthStatus("guest");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (!res.ok) {
          throw new Error("Session invalid");
        }
        const data = await res.json();
        setAuthToken(storedToken);
        setUser(data.user);
        setProfileData(data.user);
        setAuthStatus("authenticated");
      } catch (err) {
        localStorage.removeItem("smartspend_token");
        setAuthToken(null);
        setUser(null);
        setAuthStatus("guest");
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || !authToken) {
      setTransactions([]);
      setLoading(false);
      setProfileData(null);
      return;
    }
    fetchTransactions(authToken);
    fetchProfile(authToken);
  }, [authStatus, authToken]);

  useEffect(() => {
    if (!profileData) return;
    setProfileForm({
      name: profileData.name || "",
      avatarUrl: profileData.avatarUrl || ""
    });
    setEmailForm((prev) => ({ ...prev, email: profileData.email || "" }));
    setNotificationForm({
      weeklySummary: profileData.notifications?.weeklySummary ?? true,
      budgetAlerts: profileData.notifications?.budgetAlerts ?? true,
      productUpdates: profileData.notifications?.productUpdates ?? true
    });
    setPreferenceForm({
      currency: profileData.currency || "INR",
      categoryPrefs: Array.isArray(profileData.categoryPrefs)
        ? profileData.categoryPrefs
        : []
    });
  }, [profileData]);

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
    if (d.includes("rent") || d.includes("landlord") || d.includes("mortgage"))
      return "Rent";
    if (d.includes("flight") || d.includes("hotel") || d.includes("airbnb") || d.includes("travel"))
      return "Travel";
    if (d.includes("amazon") || d.includes("flipkart") || d.includes("shopping"))
      return "Shopping";
    if (d.includes("netflix") || d.includes("spotify") || d.includes("prime"))
      return "Subscriptions";
    if (d.includes("movie") || d.includes("cinema") || d.includes("concert") || d.includes("game"))
      return "Entertainment";
    if (d.includes("course") || d.includes("tuition") || d.includes("education") || d.includes("training"))
      return "Education";
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

  const resolveCategory = (tx = {}) => {
    return tx.category || getCategoryFromDescription(tx.description);
  };

  // Category breakdown
  const categoryData = transactions
    .filter(t => t.amount < 0)
    .reduce((acc, t) => {
      const category = resolveCategory(t);
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
    percentage: totalCategoryExpenses > 0 ? ((cat.value / totalCategoryExpenses) * 100).toFixed(1) : "0.0"
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
    if (!authToken) return alert("Please login to upload statements");
    const formData = new FormData();
    formData.append("statement", selectedFile);
    try {
      setUploading(true);
      const res = await fetch(`${API_BASE}/upload-statement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const txRes = await fetch(`${API_BASE}/transactions`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const txData = await txRes.json();
      setTransactions(Array.isArray(txData) ? txData : []);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err) {
      alert("Upload failed. Check backend.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getTodayInputDate = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const formatDateForApi = (value) => {
    if (!value) return "";
    if (value.includes("/")) return value;
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const openEntryModal = () => {
    setEntryErrors({});
    setEntrySuccess("");
    setEntryForm((prev) => ({
      ...prev,
      date: getTodayInputDate()
    }));
    setShowEntryModal(true);
  };

  const closeEntryModal = () => {
    setShowEntryModal(false);
    setEntryErrors({});
    setEntrySuccess("");
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const errors = {};

    if (!entryForm.amount || Number(entryForm.amount) <= 0) {
      errors.amount = "Enter a valid amount";
    }
    if (!entryForm.category) {
      errors.category = "Select a category";
    }
    if (!entryForm.date) {
      errors.date = "Choose a date";
    }
    if (!entryForm.paymentMethod) {
      errors.paymentMethod = "Select a payment method";
    }

    if (Object.keys(errors).length > 0) {
      setEntryErrors(errors);
      return;
    }

    if (!authToken) {
      setEntryErrors({ form: "Please login to add entries" });
      return;
    }

    const amountValue = Number(entryForm.amount);
    const signedAmount =
      entryForm.type === "expense" ? -Math.abs(amountValue) : Math.abs(amountValue);
    const formattedDate = formatDateForApi(entryForm.date);
    const notes = entryForm.notes?.trim();
    const description =
      notes && notes.length > 0
        ? notes
        : `${entryForm.type === "expense" ? "Expense" : "Income"} • ${entryForm.category}`;

    try {
      setEntrySubmitting(true);
      setEntryErrors({});
      setEntrySuccess("");
      const res = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amount: signedAmount,
          category: entryForm.category,
          date: formattedDate,
          paymentMethod: entryForm.paymentMethod,
          notes: notes || "",
          description
        })
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to save entry");
      }

      const created = await res.json();
      setTransactions((prev) => [created, ...prev]);
      setEntrySuccess("Entry added successfully");
      setEntryForm({
        type: entryForm.type,
        amount: "",
        category: entryForm.category,
        date: getTodayInputDate(),
        paymentMethod: entryForm.paymentMethod,
        notes: ""
      });
    } catch (err) {
      setEntryErrors({ form: err.message || "Failed to save entry" });
    } finally {
      setEntrySubmitting(false);
    }
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");

    if (!authForm.email || !authForm.password) {
      setAuthError("Email and password are required");
      return;
    }

    if (authView === "register" && !authForm.name) {
      setAuthError("Name is required for registration");
      return;
    }

    try {
      setAuthProcessing(true);
      const payload =
        authView === "register"
          ? { name: authForm.name, email: authForm.email, password: authForm.password }
          : { email: authForm.email, password: authForm.password };

      const res = await fetch(`${API_BASE}/auth/${authView}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Authentication failed");
      }

      const data = await res.json();
      localStorage.setItem("smartspend_token", data.token);
      setAuthToken(data.token);
      setUser(data.user);
      setProfileData(data.user);
      setAuthStatus("authenticated");
      setActiveTab("dashboard");
      setAuthForm({ name: "", email: "", password: "" });
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }
    } catch (err) {
      console.warn("Logout failed", err);
    } finally {
      localStorage.removeItem("smartspend_token");
      setAuthToken(null);
      setUser(null);
      setAuthStatus("guest");
      setTransactions([]);
      setActiveTab("dashboard");
      setShowUploadModal(false);
      setShowEntryModal(false);
    }
  };

  const formatDateDisplay = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleProfileSave = async () => {
    if (!authToken) return;
    if (!profileForm.name.trim()) {
      setProfileNotice({ type: "error", text: "Name cannot be empty" });
      return;
    }
    try {
      setProfileSaving(true);
      setProfileNotice(null);
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          avatarUrl: profileForm.avatarUrl.trim()
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update profile");
      }
      const data = await res.json();
      setProfileData(data.user);
      setUser(data.user);
      setProfileNotice({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setProfileNotice({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEmailSave = async () => {
    if (!authToken) return;
    if (!emailForm.email || !emailForm.password) {
      setAccountNotice({ type: "error", text: "Enter email and password" });
      return;
    }
    try {
      setEmailSaving(true);
      setAccountNotice(null);
      const res = await fetch(`${API_BASE}/auth/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          email: emailForm.email.trim(),
          password: emailForm.password
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update email");
      }
      const data = await res.json();
      setProfileData(data.user);
      setUser(data.user);
      setEmailForm({ email: data.user.email, password: "" });
      setAccountNotice({ type: "success", text: "Email updated successfully" });
    } catch (err) {
      setAccountNotice({ type: "error", text: err.message || "Failed to update email" });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!authToken) return;
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setAccountNotice({ type: "error", text: "Fill in all password fields" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setAccountNotice({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAccountNotice({ type: "error", text: "Passwords do not match" });
      return;
    }
    try {
      setPasswordSaving(true);
      setAccountNotice(null);
      const res = await fetch(`${API_BASE}/auth/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update password");
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setAccountNotice({ type: "success", text: "Password updated successfully" });
    } catch (err) {
      setAccountNotice({ type: "error", text: err.message || "Failed to update password" });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!authToken) return;
    try {
      setNotificationsSaving(true);
      setAccountNotice(null);
      const res = await fetch(`${API_BASE}/auth/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(notificationForm)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update notifications");
      }
      const data = await res.json();
      setProfileData(data.user);
      setAccountNotice({ type: "success", text: "Notification preferences updated" });
    } catch (err) {
      setAccountNotice({ type: "error", text: err.message || "Failed to update notifications" });
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!authToken) return;
    try {
      setPrefsSaving(true);
      setPrefsNotice(null);
      const res = await fetch(`${API_BASE}/auth/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currency: preferenceForm.currency,
          categoryPrefs: preferenceForm.categoryPrefs
        })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update preferences");
      }
      const data = await res.json();
      setProfileData(data.user);
      setPrefsNotice({ type: "success", text: "Preferences saved" });
    } catch (err) {
      setPrefsNotice({ type: "error", text: err.message || "Failed to update preferences" });
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!authToken) return;
    try {
      setLogoutAllLoading(true);
      setSecurityNotice(null);
      const res = await fetch(`${API_BASE}/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to logout all devices");
      }
      setSecurityNotice({ type: "success", text: "Logged out from all devices" });
      handleLogout();
    } catch (err) {
      setSecurityNotice({ type: "error", text: err.message || "Failed to logout all devices" });
    } finally {
      setLogoutAllLoading(false);
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

  const displayProfile = profileData || user || {};
  const avatarInitial = displayProfile?.name ? displayProfile.name.trim().charAt(0).toUpperCase() : "U";

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
          flex-wrap: wrap;
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

        .primary-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          color: #FFFFFF;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .primary-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(99, 102, 241, 0.45);
        }

        .greeting {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          font-size: 12px;
          font-weight: 600;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .greeting-name {
          font-weight: 700;
          color: ${darkMode ? '#E2E8F0' : '#1E293B'};
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

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .section-header .section-title {
          margin-bottom: 0;
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

        /* ===== PROFILE ===== */
        .profile-shell {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          align-items: start;
        }

        .profile-sidebar {
          display: grid;
          gap: 18px;
          position: sticky;
          top: 100px;
        }

        .profile-card {
          background: ${darkMode ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 1)'};
          border-radius: 18px;
          padding: 20px;
          box-shadow: ${darkMode ? '0 12px 32px rgba(0,0,0,0.25)' : '0 12px 32px rgba(99, 102, 241, 0.06)'};
        }

        .profile-summary {
          display: grid;
          gap: 16px;
          text-align: center;
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          margin: 0 auto;
          overflow: hidden;
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 28px;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-meta h3 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 6px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .profile-meta p {
          font-size: 13px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .profile-nav {
          display: grid;
          gap: 10px;
        }

        .profile-tab {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
          color: ${darkMode ? '#CBD5F5' : '#475569'};
          background: ${darkMode ? 'rgba(15, 23, 42, 0.4)' : '#F1F5F9'};
          transition: all 0.2s ease;
        }

        .profile-tab.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          color: ${darkMode ? '#F8FAFC' : '#1E293B'};
          border: 1px solid rgba(99, 102, 241, 0.35);
        }

        .profile-content {
          display: grid;
          gap: 20px;
        }

        .profile-panel {
          animation: fadeIn 0.25s ease;
        }

        .profile-section-title {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .profile-field {
          display: grid;
          gap: 6px;
          font-size: 13px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .profile-field strong {
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
          font-size: 14px;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          background: ${darkMode ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC'};
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)'};
        }

        .toggle {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.5);
          position: relative;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle::after {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: white;
          top: 3px;
          left: 3px;
          transition: transform 0.2s ease;
        }

        .toggle.active {
          background: #6366F1;
        }

        .toggle.active::after {
          transform: translateX(20px);
        }

        .pref-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pref-chip {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.3)'};
          background: ${darkMode ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9'};
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          color: ${darkMode ? '#E2E8F0' : '#475569'};
          transition: all 0.2s ease;
        }

        .pref-chip.active {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: #FFFFFF;
          border-color: transparent;
        }

        .status-banner {
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .status-banner.success {
          background: ${darkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'};
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }

        .status-banner.error {
          background: ${darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'};
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.35);
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
        .upload-modal,
        .entry-modal {
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

        .upload-content,
        .entry-content {
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

        .entry-content {
          max-width: 620px;
        }

        .entry-header {
          font-size: 22px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 6px;
          text-align: center;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .entry-subtitle {
          font-size: 13px;
          text-align: center;
          margin-bottom: 24px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field.full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: ${darkMode ? '#CBD5F5' : '#475569'};
        }

        .form-input,
        .form-select,
        .form-textarea {
          background: ${darkMode ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC'};
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.3)'};
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: ${darkMode ? '#F8FAFC' : '#1E293B'};
          outline: none;
          transition: border 0.2s ease, box-shadow 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .form-textarea {
          min-height: 90px;
          resize: vertical;
        }

        .input-with-prefix {
          position: relative;
        }

        .input-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 700;
          color: ${darkMode ? '#E2E8F0' : '#475569'};
        }

        .input-with-prefix .form-input {
          padding-left: 30px;
        }

        .pill-group {
          display: flex;
          gap: 10px;
        }

        .pill {
          flex: 1;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.3)'};
          background: ${darkMode ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9'};
          color: ${darkMode ? '#E2E8F0' : '#475569'};
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill.active {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: #FFFFFF;
          border-color: transparent;
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.3);
        }

        .form-error {
          font-size: 12px;
          color: #EF4444;
          font-weight: 600;
        }

        .form-success {
          font-size: 12px;
          color: #10B981;
          font-weight: 700;
        }

        .form-alert {
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .form-alert.error {
          background: ${darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'};
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }

        .form-alert.success {
          background: ${darkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'};
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.35);
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-compact {
          padding: 10px 14px;
          font-size: 13px;
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

        /* ===== AUTH ===== */
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          position: relative;
          overflow: hidden;
        }

        .auth-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.35), transparent 45%),
            radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.25), transparent 40%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.6));
          opacity: ${darkMode ? 1 : 0.55};
        }

        .auth-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 980px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
        }

        .auth-hero {
          border-radius: 24px;
          padding: 32px;
          background: ${darkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)'};
          border: 1px solid ${darkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.2)'};
          backdrop-filter: blur(18px);
          color: ${darkMode ? '#E2E8F0' : '#1E293B'};
        }

        .auth-hero h2 {
          font-size: 26px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 12px;
        }

        .auth-hero p {
          font-size: 14px;
          line-height: 1.7;
          color: ${darkMode ? '#94A3B8' : '#475569'};
        }

        .auth-highlights {
          margin-top: 20px;
          display: grid;
          gap: 12px;
        }

        .auth-highlight {
          padding: 14px 16px;
          border-radius: 16px;
          background: ${darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(248, 250, 252, 0.95)'};
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.25)'};
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 13px;
          font-weight: 600;
          color: ${darkMode ? '#CBD5F5' : '#475569'};
        }

        .auth-highlight-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(139, 92, 246, 0.7));
          color: #FFFFFF;
          flex-shrink: 0;
        }

        .auth-highlight-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
          color: ${darkMode ? '#F1F5F9' : '#1E293B'};
        }

        .auth-highlight-desc {
          font-size: 12px;
          font-weight: 500;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          line-height: 1.5;
        }

        .auth-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(0px);
          opacity: 0.5;
          z-index: 0;
        }

        .auth-hero {
          position: relative;
          overflow: hidden;
        }

        .auth-hero h2,
        .auth-hero p,
        .auth-highlights {
          position: relative;
          z-index: 1;
        }

        .auth-orb.orb-1 {
          width: 140px;
          height: 140px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 70%);
          top: -40px;
          right: -20px;
        }

        .auth-orb.orb-2 {
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent 70%);
          bottom: 20px;
          left: -30px;
        }

        .auth-orb.orb-3 {
          width: 90px;
          height: 90px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.35), transparent 70%);
          bottom: -20px;
          right: 20px;
        }

        .auth-card {
          border-radius: 24px;
          padding: 32px;
          background: ${darkMode ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF'};
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(226, 232, 240, 1)'};
          box-shadow: ${darkMode ? '0 18px 60px rgba(0, 0, 0, 0.4)' : '0 18px 60px rgba(15, 23, 42, 0.12)'};
          backdrop-filter: blur(18px);
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 6px;
          color: ${darkMode ? '#F8FAFC' : '#1E293B'};
        }

        .auth-subtitle {
          font-size: 14px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          margin-bottom: 24px;
        }

        .auth-form {
          display: grid;
          gap: 14px;
        }

        .auth-input {
          width: 100%;
          background: ${darkMode ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC'};
          border: 1px solid ${darkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.3)'};
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: ${darkMode ? '#F8FAFC' : '#1E293B'};
          outline: none;
          transition: border 0.2s ease, box-shadow 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .auth-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        .auth-error {
          background: ${darkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)'};
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #EF4444;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        .auth-actions {
          display: grid;
          gap: 10px;
          margin-top: 8px;
        }

        .auth-switch {
          margin-top: 18px;
          font-size: 13px;
          color: ${darkMode ? '#94A3B8' : '#64748B'};
          text-align: center;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #6366F1;
          font-weight: 700;
          cursor: pointer;
          margin-left: 6px;
        }

        .auth-toggle {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 2;
        }

        .auth-loading {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: ${darkMode ? '#E2E8F0' : '#1E293B'};
          font-weight: 600;
        }

        .auth-spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid rgba(99, 102, 241, 0.25);
          border-top-color: #6366F1;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 960px) {
          .auth-shell {
            grid-template-columns: 1fr;
          }

          .auth-hero {
            order: 2;
          }
        }

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

          .form-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            grid-template-columns: 1fr;
          }

          .profile-shell {
            grid-template-columns: 1fr;
          }

          .profile-sidebar {
            position: static;
          }

          .profile-grid {
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

          .primary-action span {
            display: none;
          }

          .primary-action {
            width: 42px;
            height: 42px;
            padding: 0;
            justify-content: center;
          }

          .auth-hero {
            display: none;
          }

          .auth-card {
            padding: 24px;
          }
        }
      `}</style>

      {!isAuthenticated ? (
        <div className="auth-page">
          <button
            className="icon-btn auth-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {authStatus === "checking" ? (
            <div className="auth-loading">
              <div className="auth-spinner" />
              Securing your session...
            </div>
          ) : (
            <div className="auth-shell">
              <div className="auth-hero">
                <div className="auth-orb orb-1" />
                <div className="auth-orb orb-2" />
                <div className="auth-orb orb-3" />
                <h2>SmartSpend, simplified.</h2>
                <p>
                  Track expenses, visualize trends, and keep every manual entry in sync with
                  your charts. Your dashboard stays clean, fast, and personalized.
                </p>
                <div className="auth-highlights">
                  {authHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="auth-highlight">
                        <div className="auth-highlight-icon">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="auth-highlight-title">{item.title}</div>
                          <div className="auth-highlight-desc">{item.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="auth-card">
                <div className="auth-brand">
                  <div className="logo">SmartSpend</div>
                </div>
                <div className="auth-title">
                  {authView === "login" ? "Welcome back" : "Create your account"}
                </div>
                <div className="auth-subtitle">
                  {authView === "login"
                    ? "Sign in to access your dashboard"
                    : "Start tracking smarter today"}
                </div>

                {authError && <div className="auth-error">{authError}</div>}

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  {authView === "register" && (
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="Full name"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      autoComplete="name"
                      required
                    />
                  )}
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="Email address"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    autoComplete={authView === "login" ? "current-password" : "new-password"}
                    required
                  />

                  <div className="auth-actions">
                    <button className="btn btn-primary" type="submit" disabled={authProcessing}>
                      {authProcessing
                        ? "Please wait..."
                        : authView === "login"
                          ? "Sign In"
                          : "Create Account"}
                    </button>
                  </div>
                </form>

                <div className="auth-switch">
                  {authView === "login" ? "New here?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView(authView === "login" ? "register" : "login");
                      setAuthError("");
                    }}
                  >
                    {authView === "login" ? "Create one" : "Back to login"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="header">
  <div className="header-content">
    <div className="logo-section">
      <div className="logo">SmartSpend</div>
      <div className="tagline">AI-Powered Finance Tracker</div>

      <div className="greeting">
        <span className="greeting-text">Welcome back,</span>
        <span className="greeting-name"> {user?.name || "there"} 😃</span>
      </div>
    </div>

    <div className="header-actions">
      <button
        className="primary-action"
        onClick={openEntryModal}
        title="Add expense or income"
      >
        <Plus size={18} />
        <span>Add Entry</span>
      </button>

      <button
        className="icon-btn"
        onClick={() => setShowUploadModal(true)}
        title="Upload statement"
      >
        <Upload size={20} />
      </button>

      <button
        className="icon-btn"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
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
            <div className="section-header">
              <div className="section-title">
                <Calendar size={26} />
                Transaction History
              </div>
              <button className="btn btn-primary btn-compact" onClick={openEntryModal}>
                <Plus size={16} />
                Add Entry
              </button>
            </div>
            
            <div className="category-filters">
              {categoryFilters.map(cat => (
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
                  .filter(t => selectedCategory === 'All' || resolveCategory(t) === selectedCategory)
                  .map(tx => {
                    const category = resolveCategory(tx);
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
                            {icons[category] || icons.Others}
                          </div>
                          <div className="transaction-details">
                            <h4>{tx.description || 'Manual entry'}</h4>
                            <p>
                              {tx.date}
                              {tx.paymentMethod ? ` • ${tx.paymentMethod}` : ''}
                            </p>
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
            <div className="section-title">Account Dashboard</div>
            <div className="profile-shell">
              <aside className="profile-sidebar">
                <div className="profile-card profile-summary">
                  <div className="profile-avatar">
                    {displayProfile.avatarUrl ? (
                      <img src={displayProfile.avatarUrl} alt={displayProfile.name || "Profile"} />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div className="profile-meta">
                    <h3>{displayProfile.name || "User"}</h3>
                    <p>{displayProfile.email || "user@smartspend.ai"}</p>
                    <p>Joined {formatDateDisplay(displayProfile.createdAt)}</p>
                  </div>
                </div>

                <div className="profile-card">
                  <div className="profile-nav">
                    {profileSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <div
                          key={section.id}
                          className={`profile-tab ${profileSection === section.id ? "active" : ""}`}
                          onClick={() => {
                            setProfileSection(section.id);
                            setProfileNotice(null);
                            setAccountNotice(null);
                            setSecurityNotice(null);
                            setPrefsNotice(null);
                          }}
                        >
                          <Icon size={16} />
                          {section.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="profile-card">
                  <button className="btn btn-secondary" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </aside>

              <section className="profile-content">
                {profileSection === "overview" && (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-section-title">
                        <User size={16} />
                        Profile Summary
                      </div>
                      {profileLoading && <div className="form-alert">Loading profile...</div>}
                      <div className="profile-grid">
                        <div className="profile-field">
                          <span>Name</span>
                          <strong>{displayProfile.name || "--"}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Email</span>
                          <strong>{displayProfile.email || "--"}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Default Currency</span>
                          <strong>{displayProfile.currency || "INR"}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Joined</span>
                          <strong>{formatDateDisplay(displayProfile.createdAt)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {profileSection === "edit" && (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-section-title">
                        <Camera size={16} />
                        Edit Profile
                      </div>
                      {profileNotice && (
                        <div className={`status-banner ${profileNotice.type}`}>{profileNotice.text}</div>
                      )}
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">Full name</label>
                          <input
                            className="form-input"
                            type="text"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Profile image URL</label>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="https://"
                            value={profileForm.avatarUrl}
                            onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => fetchProfile(authToken)}>
                          Reset
                        </button>
                        <button className="btn btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                          {profileSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {profileSection === "account" && (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-section-title">
                        <Settings size={16} />
                        Account Settings
                      </div>
                      {accountNotice && (
                        <div className={`status-banner ${accountNotice.type}`}>{accountNotice.text}</div>
                      )}
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">Update email</label>
                          <input
                            className="form-input"
                            type="email"
                            value={emailForm.email}
                            onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Current password</label>
                          <input
                            className="form-input"
                            type="password"
                            value={emailForm.password}
                            onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="action-buttons" style={{ marginBottom: "20px" }}>
                        <button className="btn btn-primary" onClick={handleEmailSave} disabled={emailSaving}>
                          {emailSaving ? "Updating..." : "Update Email"}
                        </button>
                      </div>

                      <div className="profile-section-title">
                        <Key size={16} />
                        Change password
                      </div>
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">Current password</label>
                          <input
                            className="form-input"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">New password</label>
                          <input
                            className="form-input"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Confirm new password</label>
                          <input
                            className="form-input"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="action-buttons" style={{ marginBottom: "20px" }}>
                        <button className="btn btn-primary" onClick={handlePasswordSave} disabled={passwordSaving}>
                          {passwordSaving ? "Updating..." : "Update Password"}
                        </button>
                      </div>

                      <div className="profile-section-title">
                        <Bell size={16} />
                        Notifications
                      </div>
                      <div style={{ display: "grid", gap: "12px" }}>
                        <div className="toggle-row">
                          <span>Weekly summary emails</span>
                          <div
                            className={`toggle ${notificationForm.weeklySummary ? "active" : ""}`}
                            onClick={() =>
                              setNotificationForm({
                                ...notificationForm,
                                weeklySummary: !notificationForm.weeklySummary
                              })
                            }
                          />
                        </div>
                        <div className="toggle-row">
                          <span>Budget alerts</span>
                          <div
                            className={`toggle ${notificationForm.budgetAlerts ? "active" : ""}`}
                            onClick={() =>
                              setNotificationForm({
                                ...notificationForm,
                                budgetAlerts: !notificationForm.budgetAlerts
                              })
                            }
                          />
                        </div>
                        <div className="toggle-row">
                          <span>Product updates</span>
                          <div
                            className={`toggle ${notificationForm.productUpdates ? "active" : ""}`}
                            onClick={() =>
                              setNotificationForm({
                                ...notificationForm,
                                productUpdates: !notificationForm.productUpdates
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button
                          className="btn btn-primary"
                          onClick={handleNotificationsSave}
                          disabled={notificationsSaving}
                        >
                          {notificationsSaving ? "Saving..." : "Save Notifications"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {profileSection === "security" && (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-section-title">
                        <Shield size={16} />
                        Security Settings
                      </div>
                      {securityNotice && (
                        <div className={`status-banner ${securityNotice.type}`}>{securityNotice.text}</div>
                      )}
                      <div className="profile-grid" style={{ marginBottom: "20px" }}>
                        <div className="profile-field">
                          <span>Last login</span>
                          <strong>{formatDateDisplay(displayProfile.lastLoginAt)}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Last login IP</span>
                          <strong>{displayProfile.lastLoginIp || "--"}</strong>
                        </div>
                        <div className="profile-field">
                          <span>Active session</span>
                          <strong>Token-based</strong>
                        </div>
                        <div className="profile-field">
                          <span>Security status</span>
                          <strong>Protected</strong>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary"
                          style={{ color: '#EF4444' }}
                          onClick={handleLogoutAll}
                          disabled={logoutAllLoading}
                        >
                          {logoutAllLoading ? "Logging out..." : "Logout from all devices"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {profileSection === "preferences" && (
                  <div className="profile-panel">
                    <div className="profile-card">
                      <div className="profile-section-title">
                        <Tags size={16} />
                        Data & Preferences
                      </div>
                      {prefsNotice && (
                        <div className={`status-banner ${prefsNotice.type}`}>{prefsNotice.text}</div>
                      )}
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="form-label">Default currency</label>
                          <select
                            className="form-select"
                            value={preferenceForm.currency}
                            onChange={(e) =>
                              setPreferenceForm({ ...preferenceForm, currency: e.target.value })
                            }
                          >
                            {currencyOptions.map((currency) => (
                              <option key={currency} value={currency}>
                                {currency}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Preferred categories</label>
                          <div className="pref-chips">
                            {categoryOptions.map((cat) => {
                              const active = preferenceForm.categoryPrefs.includes(cat);
                              return (
                                <div
                                  key={cat}
                                  className={`pref-chip ${active ? "active" : ""}`}
                                  onClick={() => {
                                    const next = active
                                      ? preferenceForm.categoryPrefs.filter((item) => item !== cat)
                                      : [...preferenceForm.categoryPrefs, cat];
                                    setPreferenceForm({ ...preferenceForm, categoryPrefs: next });
                                  }}
                                >
                                  {cat}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="action-buttons">
                        <button className="btn btn-primary" onClick={handlePreferencesSave} disabled={prefsSaving}>
                          {prefsSaving ? "Saving..." : "Save Preferences"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
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

      {/* Manual Entry Modal */}
      {showEntryModal && (
        <div className="entry-modal" onClick={closeEntryModal}>
          <div className="entry-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="entry-header">Add Expense / Spending</h2>
            <div className="entry-subtitle">Log a manual entry and update your insights instantly.</div>

            {entryErrors.form && <div className="form-alert error">{entryErrors.form}</div>}
            {entrySuccess && <div className="form-alert success">{entrySuccess}</div>}

            <form onSubmit={handleManualSubmit}>
              <div className="form-grid">
                <div className="form-field full">
                  <label className="form-label">Entry type</label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill ${entryForm.type === "expense" ? "active" : ""}`}
                      onClick={() =>
                        setEntryForm({
                          ...entryForm,
                          type: "expense",
                          category:
                            entryForm.category === "Income" ? "Food & Dining" : entryForm.category
                        })
                      }
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      className={`pill ${entryForm.type === "income" ? "active" : ""}`}
                      onClick={() => setEntryForm({ ...entryForm, type: "income", category: "Income" })}
                    >
                      Income
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Amount</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">₹</span>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={entryForm.amount}
                      onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  {entryErrors.amount && <div className="form-error">{entryErrors.amount}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={entryForm.date}
                    onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                    required
                  />
                  {entryErrors.date && <div className="form-error">{entryErrors.date}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={entryForm.category}
                    onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                    required
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {entryErrors.category && <div className="form-error">{entryErrors.category}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Payment method</label>
                  <select
                    className="form-select"
                    value={entryForm.paymentMethod}
                    onChange={(e) => setEntryForm({ ...entryForm, paymentMethod: e.target.value })}
                    required
                  >
                    {paymentOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  {entryErrors.paymentMethod && <div className="form-error">{entryErrors.paymentMethod}</div>}
                </div>

                <div className="form-field full">
                  <label className="form-label">Notes (optional)</label>
                  <textarea
                    className="form-textarea"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                    placeholder="Add a quick description or reference"
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn btn-secondary" type="button" onClick={closeEntryModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={entrySubmitting}>
                  {entrySubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SmartSpend;
