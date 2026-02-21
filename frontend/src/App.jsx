import React, { useState, useEffect, useRef } from 'react';
import { PieChart as PieIcon, CreditCard, Target, User, Settings, Shield, Sparkles, Tags, Camera } from 'lucide-react';
import AuthPage from './components/AuthPage';
import AppHeader from './components/AppHeader';
import RefreshIndicator from './components/RefreshIndicator';
import DashboardTab from './components/DashboardTab';
import TransactionsTab from './components/TransactionsTab';
import InsightsTab from './components/InsightsTab';
import ProfileTab from './components/ProfileTab';
import BottomNavigation from './components/BottomNavigation';
import UploadModal from './components/UploadModal';
import ManualEntryModal from './components/ManualEntryModal';
import AccountModal from './components/AccountModal';
import DeleteModal from './components/DeleteModal';
import BulkDeleteModal from './components/BulkDeleteModal';
import './styles/App.css';

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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteNotice, setDeleteNotice] = useState(null);

  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountType, setAccountType] = useState("Savings");
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [linkNotice, setLinkNotice] = useState(null);

  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteInput, setBulkDeleteInput] = useState("");
  const [bulkDeleteProcessing, setBulkDeleteProcessing] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState("");
  const [bulkDeleteNotice, setBulkDeleteNotice] = useState(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pullReady, setPullReady] = useState(false);
  const pullStartRef = useRef(null);
  const pullingRef = useRef(false);

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
    { id: "aggregation", label: "Linked Accounts", icon: CreditCard },
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

  const bankOptions = [
    { id: "hdfc", name: "HDFC Bank", tone: "indigo" },
    { id: "icici", name: "ICICI Bank", tone: "rose" },
    { id: "sbi", name: "State Bank of India", tone: "blue" },
    { id: "axis", name: "Axis Bank", tone: "purple" },
    { id: "kotak", name: "Kotak Mahindra", tone: "amber" },
    { id: "yes", name: "Yes Bank", tone: "emerald" },
    { id: "citi", name: "Citi", tone: "slate" }
  ];

  const accountTypes = ["Savings", "Current", "Credit Card"];
  
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

  useEffect(() => {
    if (!user?.id) {
      setLinkedAccounts([]);
      return;
    }
    const key = `smartspend_linked_accounts_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLinkedAccounts(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        setLinkedAccounts([]);
      }
    } else {
      setLinkedAccounts([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `smartspend_linked_accounts_${user.id}`;
    localStorage.setItem(key, JSON.stringify(linkedAccounts));
  }, [linkedAccounts, user?.id]);

  // Calculate statistics
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : 0;

  const getCategoryFromDescription = (desc = "") => {
    const d = desc
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (!d) return "Others";

    const matches = (keywords) => keywords.some((keyword) => d.includes(keyword));

    if (
      matches([
        "zomato",
        "swiggy",
        "ubereats",
        "restaurant",
        "cafe",
        "coffee",
        "pizza",
        "burger",
        "food",
        "dining",
        "meal",
        "lunch",
        "dinner",
        "breakfast",
        "snack"
      ])
    )
      return "Food & Dining";

    if (
      matches([
        "uber",
        "ola",
        "metro",
        "bus",
        "train",
        "taxi",
        "cab",
        "auto",
        "rickshaw",
        "petrol",
        "fuel",
        "diesel",
        "gas",
        "parking",
        "toll",
        "irctc"
      ])
    )
      return "Transportation";

    if (matches(["rent", "landlord", "mortgage", "lease", "housing"]))
      return "Rent";

    if (
      matches([
        "travel",
        "trip",
        "flight",
        "hotel",
        "airbnb",
        "booking",
        "expedia",
        "makemytrip",
        "goibibo",
        "ixigo",
        "yatra",
        "holiday",
        "vacation",
        "tour",
        "journey"
      ])
    )
      return "Travel";

    if (
      matches([
        "amazon",
        "flipkart",
        "shopping",
        "myntra",
        "store",
        "mall",
        "purchase",
        "retail",
        "ajio"
      ])
    )
      return "Shopping";

    if (
      matches([
        "netflix",
        "spotify",
        "prime",
        "primevideo",
        "subscription",
        "disney",
        "hotstar",
        "apple",
        "youtube",
        "membership"
      ])
    )
      return "Subscriptions";

    if (
      matches([
        "movie",
        "cinema",
        "concert",
        "game",
        "bookmyshow",
        "theatre",
        "event",
        "show"
      ])
    )
      return "Entertainment";

    if (
      matches([
        "course",
        "tuition",
        "education",
        "training",
        "udemy",
        "coursera",
        "school",
        "college",
        "exam",
        "class"
      ])
    )
      return "Education";

    if (
      matches([
        "electricity",
        "mobile",
        "bill",
        "recharge",
        "water",
        "gas",
        "wifi",
        "internet",
        "broadband",
        "utility",
        "phone"
      ])
    )
      return "Utilities";

    if (
      matches([
        "gym",
        "health",
        "hospital",
        "medical",
        "pharmacy",
        "clinic",
        "doctor",
        "fitness",
        "wellness"
      ])
    )
      return "Health";

    if (
      matches([
        "sip",
        "mutual fund",
        "investment",
        "stocks",
        "equity",
        "fd",
        "deposit",
        "ppf",
        "nps"
      ])
    )
      return "Savings";

    if (matches(["salary", "bonus", "payroll", "income", "credited"]))
      return "Income";

    return "Others";
  };

  const normalizeCategory = (value) => {
    if (!value || typeof value !== "string") return "";
    const cleaned = value.trim();
    if (!cleaned) return "";
    const lower = cleaned.toLowerCase();
    if (["other", "others", "misc", "miscellaneous", "uncategorized", "unknown"].includes(lower)) {
      return "Others";
    }
    const match = categoryOptions.find((option) => option.toLowerCase() === lower);
    return match || cleaned;
  };

  const resolveCategory = (tx = {}) => {
    const rawCategory = normalizeCategory(tx.category);
    if (tx.source === "manual") {
      return rawCategory || getCategoryFromDescription(tx.description);
    }
    if (!rawCategory || rawCategory === "Others") {
      return normalizeCategory(getCategoryFromDescription(tx.description));
    }
    return rawCategory;
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
      setShowEntryModal(false);
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
      setLinkedAccounts([]);
      setActiveTab("dashboard");
      setShowUploadModal(false);
      setShowEntryModal(false);
    }
  };

  const openDeleteModal = (tx) => {
    setDeleteTarget(tx);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleteProcessing) return;
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDeleteTransaction = async () => {
    if (!authToken || !deleteTarget) return;

    try {
      setDeleteProcessing(true);
      setDeleteError("");

      const deleteId = deleteTarget._id || deleteTarget.id;
      const res = await fetch(`${API_BASE}/transactions/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to delete transaction");
      }

      setTransactions((prev) => prev.filter((tx) => (tx._id || tx.id) !== deleteId));
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteNotice({ type: "success", text: "Transaction deleted" });
      setTimeout(() => setDeleteNotice(null), 3000);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete transaction");
    } finally {
      setDeleteProcessing(false);
    }
  };

  const openBulkDeleteModal = () => {
    setBulkDeleteInput("");
    setBulkDeleteError("");
    setShowBulkDeleteModal(true);
  };

  const closeBulkDeleteModal = () => {
    if (bulkDeleteProcessing) return;
    setShowBulkDeleteModal(false);
    setBulkDeleteError("");
  };

  const handleBulkDelete = async () => {
    if (!authToken) return;
    if (bulkDeleteInput.trim() !== "DELETE") {
      setBulkDeleteError('Type "DELETE" to confirm.');
      return;
    }

    try {
      setBulkDeleteProcessing(true);
      setBulkDeleteError("");
      const res = await fetch(`${API_BASE}/transactions/all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to delete transactions");
      }
      setTransactions([]);
      setShowBulkDeleteModal(false);
      setBulkDeleteNotice({ type: "success", text: "All transactions deleted" });
      setTimeout(() => setBulkDeleteNotice(null), 3000);
    } catch (err) {
      setBulkDeleteError(err.message || "Failed to delete transactions");
    } finally {
      setBulkDeleteProcessing(false);
    }
  };

  const refreshData = async () => {
    if (!authToken) return;
    try {
      setIsRefreshing(true);
      const scrollPos = window.scrollY;
      await Promise.all([fetchTransactions(authToken), fetchProfile(authToken)]);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPos, behavior: "auto" });
      });
    } catch (err) {
      console.warn("Refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePullStart = (clientY) => {
    if (isRefreshing) return;
    if (window.scrollY > 0) return;
    pullingRef.current = true;
    pullStartRef.current = clientY;
  };

  const handlePullMove = (clientY) => {
    if (!pullingRef.current || pullStartRef.current === null) return;
    const diff = clientY - pullStartRef.current;
    if (diff <= 0) {
      setPullDistance(0);
      setPullReady(false);
      return;
    }
    const capped = Math.min(diff, 80);
    setPullDistance(capped);
    setPullReady(capped > 60);
  };

  const handlePullEnd = () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullReady) {
      setPullDistance(60);
      refreshData().finally(() => {
        setPullDistance(0);
        setPullReady(false);
      });
    } else {
      setPullDistance(0);
      setPullReady(false);
    }
  };

  const getBankInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const openAccountModal = () => {
    setSelectedBank(null);
    setAccountType("Savings");
    setShowAccountModal(true);
    setLinkNotice(null);
  };

  const closeAccountModal = () => {
    if (linkingAccount) return;
    setShowAccountModal(false);
  };

  const handleLinkAccount = async () => {
    if (!selectedBank) {
      setLinkNotice({ type: "error", text: "Select a bank to continue" });
      return;
    }
    try {
      setLinkingAccount(true);
      setLinkNotice(null);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const last4 = Math.floor(1000 + Math.random() * 9000);
      const newAccount = {
        id: `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        bankName: selectedBank.name,
        tone: selectedBank.tone,
        accountType,
        maskedNumber: `****${last4}`,
        demo: true
      };
      setLinkedAccounts((prev) => [newAccount, ...prev]);
      setShowAccountModal(false);
      setLinkNotice({ type: "success", text: "Demo account linked successfully" });
      setTimeout(() => setLinkNotice(null), 3000);
    } catch (err) {
      setLinkNotice({ type: "error", text: "Failed to link account" });
    } finally {
      setLinkingAccount(false);
    }
  };

  const handleUnlinkAccount = async (accountId) => {
    if (!accountId) return;
    try {
      setUnlinkingId(accountId);
      setLinkNotice(null);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLinkedAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setLinkNotice({ type: "success", text: "Account unlinked" });
      setTimeout(() => setLinkNotice(null), 3000);
    } catch (err) {
      setLinkNotice({ type: "error", text: "Failed to unlink account" });
    } finally {
      setUnlinkingId(null);
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

  const getTooltipColorClass = (color = "") => {
    switch (color.toLowerCase()) {
      case "#10b981":
        return "tooltip-color-emerald";
      case "#ef4444":
        return "tooltip-color-red";
      case "#f59e0b":
        return "tooltip-color-amber";
      case "#6366f1":
        return "tooltip-color-indigo";
      case "#8b5cf6":
        return "tooltip-color-violet";
      case "#ec4899":
        return "tooltip-color-pink";
      case "#3b82f6":
        return "tooltip-color-blue";
      case "#14b8a6":
        return "tooltip-color-teal";
      case "#f97316":
        return "tooltip-color-orange";
      default:
        return "tooltip-color-default";
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className={`custom-tooltip-row ${getTooltipColorClass(entry.color || "")}`}>
            {entry.name}: ₹{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  const displayProfile = profileData || user || {};
  const avatarInitial = displayProfile?.name ? displayProfile.name.trim().charAt(0).toUpperCase() : "U";

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      

      {!isAuthenticated ? (
        <AuthPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          authStatus={authStatus}
          authHighlights={authHighlights}
          authView={authView}
          setAuthView={setAuthView}
          authError={authError}
          handleAuthSubmit={handleAuthSubmit}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authProcessing={authProcessing}
          setAuthError={setAuthError}
        />
      ) : (
        <>
          <AppHeader
            displayProfile={displayProfile}
            user={user}
            setActiveTab={setActiveTab}
            openEntryModal={openEntryModal}
            setShowUploadModal={setShowUploadModal}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          <div
            className="main-content"
            onTouchStart={(e) => handlePullStart(e.touches[0].clientY)}
            onTouchMove={(e) => handlePullMove(e.touches[0].clientY)}
            onTouchEnd={handlePullEnd}
            onTouchCancel={handlePullEnd}
          >
            <RefreshIndicator
              isRefreshing={isRefreshing}
              pullDistance={pullDistance}
              pullReady={pullReady}
            />

            {activeTab === 'dashboard' && (
              <DashboardTab
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                totalSavings={totalSavings}
                savingsRate={savingsRate}
                expenseChangePercent={expenseChangePercent}
                transactions={transactions}
                insights={insights}
                yearlyData={yearlyData}
                monthlyData={monthlyData}
                latestYear={latestYear}
                categoryPercentageData={categoryPercentageData}
                categoryData={categoryData}
                savingsVsSpendingData={savingsVsSpendingData}
                darkMode={darkMode}
                COLORS={COLORS}
                CustomTooltip={CustomTooltip}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab
                openBulkDeleteModal={openBulkDeleteModal}
                transactions={transactions}
                openEntryModal={openEntryModal}
                categoryFilters={categoryFilters}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                deleteNotice={deleteNotice}
                bulkDeleteNotice={bulkDeleteNotice}
                sortedTransactions={sortedTransactions}
                resolveCategory={resolveCategory}
                openDeleteModal={openDeleteModal}
                deleteProcessing={deleteProcessing}
              />
            )}

            {activeTab === 'insights' && (
              <InsightsTab
                insights={insights}
                savingsRate={savingsRate}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                displayProfile={displayProfile}
                avatarInitial={avatarInitial}
                formatDateDisplay={formatDateDisplay}
                profileSections={profileSections}
                profileSection={profileSection}
                setProfileSection={setProfileSection}
                setProfileNotice={setProfileNotice}
                setAccountNotice={setAccountNotice}
                setSecurityNotice={setSecurityNotice}
                setPrefsNotice={setPrefsNotice}
                handleLogout={handleLogout}
                profileLoading={profileLoading}
                profileNotice={profileNotice}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                fetchProfile={fetchProfile}
                authToken={authToken}
                handleProfileSave={handleProfileSave}
                profileSaving={profileSaving}
                accountNotice={accountNotice}
                emailForm={emailForm}
                setEmailForm={setEmailForm}
                handleEmailSave={handleEmailSave}
                emailSaving={emailSaving}
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                handlePasswordSave={handlePasswordSave}
                passwordSaving={passwordSaving}
                notificationForm={notificationForm}
                setNotificationForm={setNotificationForm}
                handleNotificationsSave={handleNotificationsSave}
                notificationsSaving={notificationsSaving}
                securityNotice={securityNotice}
                handleLogoutAll={handleLogoutAll}
                logoutAllLoading={logoutAllLoading}
                openAccountModal={openAccountModal}
                linkNotice={linkNotice}
                linkedAccounts={linkedAccounts}
                getBankInitials={getBankInitials}
                handleUnlinkAccount={handleUnlinkAccount}
                unlinkingId={unlinkingId}
                prefsNotice={prefsNotice}
                preferenceForm={preferenceForm}
                setPreferenceForm={setPreferenceForm}
                currencyOptions={currencyOptions}
                categoryOptions={categoryOptions}
                handlePreferencesSave={handlePreferencesSave}
                prefsSaving={prefsSaving}
              />
            )}
          </div>

          <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          <UploadModal
            showUploadModal={showUploadModal}
            setShowUploadModal={setShowUploadModal}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handleFileUpload={handleFileUpload}
            uploading={uploading}
          />

          <ManualEntryModal
            showEntryModal={showEntryModal}
            closeEntryModal={closeEntryModal}
            entryErrors={entryErrors}
            entrySuccess={entrySuccess}
            handleManualSubmit={handleManualSubmit}
            entryForm={entryForm}
            setEntryForm={setEntryForm}
            categoryOptions={categoryOptions}
            paymentOptions={paymentOptions}
            entrySubmitting={entrySubmitting}
          />

          <AccountModal
            showAccountModal={showAccountModal}
            closeAccountModal={closeAccountModal}
            linkNotice={linkNotice}
            bankOptions={bankOptions}
            selectedBank={selectedBank}
            setSelectedBank={setSelectedBank}
            getBankInitials={getBankInitials}
            accountType={accountType}
            setAccountType={setAccountType}
            accountTypes={accountTypes}
            linkingAccount={linkingAccount}
            handleLinkAccount={handleLinkAccount}
          />

          <DeleteModal
            showDeleteModal={showDeleteModal}
            closeDeleteModal={closeDeleteModal}
            deleteTarget={deleteTarget}
            deleteError={deleteError}
            deleteProcessing={deleteProcessing}
            handleDeleteTransaction={handleDeleteTransaction}
          />

          <BulkDeleteModal
            showBulkDeleteModal={showBulkDeleteModal}
            closeBulkDeleteModal={closeBulkDeleteModal}
            bulkDeleteInput={bulkDeleteInput}
            setBulkDeleteInput={setBulkDeleteInput}
            bulkDeleteProcessing={bulkDeleteProcessing}
            bulkDeleteError={bulkDeleteError}
            handleBulkDelete={handleBulkDelete}
          />
        </>
      )}
    </div>
  );
};

export default SmartSpend;

