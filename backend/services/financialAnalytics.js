const normalizeCategory = (value) => {
  const raw = String(value || "Others").trim();
  const aliases = { food: "Food & Dining", dining: "Food & Dining", "food & dining": "Food & Dining", transport: "Transportation", transportation: "Transportation", subscription: "Subscriptions", subscriptions: "Subscriptions", other: "Others", others: "Others" };
  return aliases[raw.toLowerCase()] || raw;
};
export const ANALYTICS_RULES = Object.freeze({
  minimumComparableDays: 7,
  minimumTransactionsPerPeriod: 2,
  categoryIncreasePercent: 30,
  minimumCategoryIncrease: 500,
  minimumCategoryIncreaseShare: 0.05,
  categoryConcentrationPercent: 45,
  savingsRateChangePoints: 5,
  recurringMinimumOccurrences: 3,
  recurringMinimumMonthlyIntervals: 2,
  anomalyMinimumHistoricalTransactions: 5,
  anomalyMultiplier: 3,
  anomalyMinimumDifference: 1000
});
const amountOf = (tx) => Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : null;
export const parseTransactionDate = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  if (typeof value !== "string") return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m && !iso) return null;
  const day = Number(m ? m[1] : iso[3]), month = Number(m ? m[2] : iso[2]), year = Number(m ? m[3] : iso[1]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDate() === day && date.getUTCMonth() === month - 1 ? date : null;
};
const aggregate = (list, start, end) => {
  const rows = list.filter((tx) => tx.date && tx.date >= start && tx.date < end);
  const out = { income: 0, expenses: 0, netSavings: 0, savingsRate: null, transactionCount: rows.length, days: Math.ceil((end - start) / 86400000), categories: {}, transactions: rows };
  for (const tx of rows) {
    const amount = amountOf(tx);
    if (amount === null || amount === 0) continue;
    if (amount > 0) out.income += amount;
    else { const category = normalizeCategory(tx.category); out.expenses += Math.abs(amount); out.categories[category] = (out.categories[category] || 0) + Math.abs(amount); }
  }
  out.netSavings = out.income - out.expenses;
  out.savingsRate = out.income > 0 ? out.netSavings / out.income * 100 : null;
  return out;
};
const periodRange = (period, now) => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = period === "year" ? new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) : period === "quarter" ? new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const duration = end - start;
  return { start, end, previousStart: new Date(start - duration), previousEnd: start };
};
const idFor = (...parts) => parts.join(":").toLowerCase().replace(/[^a-z0-9:]+/g, "-");
const compare = (current, previous) => previous > 0 ? (current - previous) / previous * 100 : null;
const recurringCandidates = (transactions) => {
  const groups = new Map();
  for (const tx of transactions) {
    const amount = amountOf(tx), merchant = String(tx.description || "").toLowerCase().replace(/\b\d+\b/g, " ").replace(/[^a-z]+/g, " ").trim().split(/\s+/).slice(0, 3).join(" ");
    const date = parseTransactionDate(tx.date);
    if (amount >= 0 || !merchant || !date) continue;
    const key = `${merchant}|${Math.round(Math.abs(amount) / 10) * 10}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ tx, date, amount: Math.abs(amount), key });
  }
  return [...groups.values()].map((rows) => rows.sort((a,b) => a.date-b.date)).filter((rows) => {
    const gaps = rows.slice(1).map((row, i) => (row.date - rows[i].date) / 86400000);
    return rows.length >= ANALYTICS_RULES.recurringMinimumOccurrences && gaps.filter((days) => days >= 20 && days <= 40).length >= ANALYTICS_RULES.recurringMinimumMonthlyIntervals;
  }).map((rows) => ({ rows, label: rows[0].tx.description || "Recurring payment", total: rows.reduce((s, row) => s + row.amount, 0) }));
};
const recommendationEngine = (transactions, current, previous, period, range) => {
  const out = [], names = new Set([...Object.keys(current.categories), ...Object.keys(previous.categories)]);
  if (current.days >= ANALYTICS_RULES.minimumComparableDays && previous.days >= ANALYTICS_RULES.minimumComparableDays && current.transactionCount >= ANALYTICS_RULES.minimumTransactionsPerPeriod && previous.transactionCount >= ANALYTICS_RULES.minimumTransactionsPerPeriod) for (const category of names) {
    const before = previous.categories[category] || 0, after = current.categories[category] || 0, change = compare(after, before);
    if (before > 0 && change >= ANALYTICS_RULES.categoryIncreasePercent && after - before >= Math.max(ANALYTICS_RULES.minimumCategoryIncrease, previous.expenses * ANALYTICS_RULES.minimumCategoryIncreaseShare)) out.push({ id: idFor("category-increase", category, period), type: "spending-increase", title: `${category} spending increased`, description: `Spending rose from ${before.toFixed(2)} to ${after.toFixed(2)} in comparable ${period} periods.`, priority: change >= 75 ? "high" : "medium", category, evidence: { currentAmount: after, previousAmount: before, changePercent: Number(change.toFixed(1)), period }, comparisonPeriod: period, suggestedAction: `Review your ${category.toLowerCase()} transactions to see what drove the change.`, estimatedSavings: null, confidence: "high", transactionIds: current.transactions.filter((tx) => normalizeCategory(tx.category) === category && amountOf(tx) < 0).map((tx) => String(tx._id || tx.id || "")).filter(Boolean) });
  }
  if (current.expenses > 0 && Object.keys(current.categories).length >= 2) {
    const [category, value] = Object.entries(current.categories).sort((a,b) => b[1]-a[1])[0], share = value / current.expenses * 100;
    if (share >= ANALYTICS_RULES.categoryConcentrationPercent) out.push({ id: idFor("category-concentration", category, period), type: "category-concentration", title: `Spending is concentrated in ${category}`, description: `${category} accounts for ${share.toFixed(1)}% of recorded expenses this ${period}.`, priority: "informational", category, evidence: { amount: value, totalExpenses: current.expenses, percentage: Number(share.toFixed(1)), period }, comparisonPeriod: null, suggestedAction: `Review ${category.toLowerCase()} transactions and identify any flexible purchases.`, estimatedSavings: null, confidence: "high", transactionIds: current.transactions.filter((tx) => normalizeCategory(tx.category) === category && amountOf(tx) < 0).map((tx) => String(tx._id || tx.id || "")).filter(Boolean) });
  }
  if (current.savingsRate !== null && previous.savingsRate !== null && current.transactionCount >= ANALYTICS_RULES.minimumTransactionsPerPeriod && previous.transactionCount >= ANALYTICS_RULES.minimumTransactionsPerPeriod) {
    const change = current.savingsRate - previous.savingsRate;
    if (Math.abs(change) >= ANALYTICS_RULES.savingsRateChangePoints) out.push({ id: idFor("savings-rate", change > 0 ? "improved" : "declined", period), type: "savings-change", title: change > 0 ? "Savings rate improved" : "Savings rate declined", description: `Calculated savings rate moved from ${previous.savingsRate.toFixed(1)}% to ${current.savingsRate.toFixed(1)}% in comparable ${period} periods.`, priority: change > 0 ? "positive" : "medium", category: null, evidence: { currentRate: Number(current.savingsRate.toFixed(1)), previousRate: Number(previous.savingsRate.toFixed(1)), changePercentagePoints: Number(change.toFixed(1)), period }, comparisonPeriod: period, suggestedAction: change > 0 ? "Review which changes contributed to this improvement." : "Review recent expenses alongside recorded income.", estimatedSavings: null, confidence: "high", transactionIds: [] });
  }
  for (const candidate of recurringCandidates(transactions).slice(0, 2)) out.push({ id: idFor("recurring", candidate.rows[0].key), type: "recurring-candidate", title: "Potential recurring payment", description: `${candidate.label} appears ${candidate.rows.length} times around monthly intervals; the recorded total is ${candidate.total.toFixed(2)}.`, priority: "informational", category: null, evidence: { occurrenceCount: candidate.rows.length, totalAmount: candidate.total, intervalDays: candidate.rows.slice(1).map((row, i) => Math.round((row.date - candidate.rows[i].date) / 86400000)) }, comparisonPeriod: null, suggestedAction: "Check whether this is a subscription or another repeating payment.", estimatedSavings: null, confidence: "medium", transactionIds: candidate.rows.map((row) => String(row.tx._id || row.tx.id || "")).filter(Boolean) });
  const valid = transactions.filter((tx) => amountOf(tx) < 0 && parseTransactionDate(tx.date));
  if (valid.length >= 6) {
    for (const tx of valid.filter((row) => { const date = parseTransactionDate(row.date); return date >= range.start && date < range.end; })) {
      const txDate = parseTransactionDate(tx.date);
      const peers = valid.filter((row) => row !== tx && parseTransactionDate(row.date) < txDate && normalizeCategory(row.category) === normalizeCategory(tx.category)).map((row) => Math.abs(amountOf(row))).sort((a,b) => a-b);
      if (peers.length < ANALYTICS_RULES.anomalyMinimumHistoricalTransactions) continue;
      const median = peers[Math.floor(peers.length / 2)], amount = Math.abs(amountOf(tx));
      if (amount >= median * ANALYTICS_RULES.anomalyMultiplier && amount - median >= ANALYTICS_RULES.anomalyMinimumDifference) out.push({ id: idFor("unusual", tx._id || tx.date, tx.description), type: "unusual-transaction", title: "Unusually large expense", description: `${tx.description || tx.category} was ${amount.toFixed(2)}, over three times the historical ${normalizeCategory(tx.category)} median of ${median.toFixed(2)}.`, priority: "medium", category: normalizeCategory(tx.category), evidence: { transactionAmount: amount, categoryMedian: median, sampleSize: peers.length }, comparisonPeriod: "Historical category transactions", suggestedAction: "Review the transaction to confirm it matches your records.", estimatedSavings: null, confidence: "medium", transactionIds: [String(tx._id || tx.id || "")].filter(Boolean) });
    }
  }
  const rank = { high: 0, medium: 1, positive: 2, informational: 3 };
  return out.sort((a,b) => rank[a.priority]-rank[b.priority] || (b.evidence.changePercent || b.evidence.percentage || 0)-(a.evidence.changePercent || a.evidence.percentage || 0));
};
export const buildFinancialSummary = ({ transactions = [], period = "month", now = new Date() } = {}) => {
  if (!["month", "quarter", "year"].includes(period)) throw new Error("Invalid period");
  const normalized = transactions.map((tx) => ({ ...tx, date: parseTransactionDate(tx.date) })).filter((tx) => amountOf(tx) !== null);
  const range = periodRange(period, now), current = aggregate(normalized, range.start, range.end), previous = aggregate(normalized, range.previousStart, range.previousEnd);
  const categories = Object.entries(current.categories).map(([name, value]) => ({ name, value, percentage: current.expenses ? Number((value/current.expenses*100).toFixed(1)) : 0 })).sort((a,b) => b.value-a.value);
  const monthlyData = [];
  for (let i=11;i>=0;i--) { const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-i, 1)), key = `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`, totals = aggregate(normalized,date,new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1))); const label = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1)).toLocaleString("en",{month:"short",timeZone:"UTC"})+` ${date.getUTCFullYear()}`; monthlyData.push({year:date.getUTCFullYear(),monthIndex:date.getUTCMonth(),month:label.split(" ")[0],label,income:totals.income,expenses:totals.expenses,savings:totals.netSavings}); }
  const largestTransactions = normalized.filter((tx) => amountOf(tx)<0).sort((a,b)=>Math.abs(amountOf(b))-Math.abs(amountOf(a))).slice(0,5).map((tx)=>({id:String(tx._id||tx.id||""),date:tx.date?.toISOString().slice(0,10)||null,description:tx.description||tx.category||"Expense",amount:Math.abs(amountOf(tx)),category:normalizeCategory(tx.category)}));
  const recommendations = recommendationEngine(normalized,current,previous,period,range);
  return { period, currency:null, asOf:now.toISOString(), current:{income:current.income,expenses:current.expenses,netSavings:current.netSavings,savingsRate:current.savingsRate,averageDailySpending:current.days?current.expenses/current.days:null,transactionCount:current.transactionCount,days:current.days,start:range.start.toISOString().slice(0,10),end:new Date(range.end-86400000).toISOString().slice(0,10)}, previous:{income:previous.income,expenses:previous.expenses,netSavings:previous.netSavings,savingsRate:previous.savingsRate,transactionCount:previous.transactionCount}, changes:{expensesPercent:compare(current.expenses,previous.expenses),incomePercent:compare(current.income,previous.income)}, categories, monthlyData, largestTransactions, totalTransactions:transactions.length, recommendations };
};
export const getRecommendationPayload = (summary) => ({ period:summary.period,currency:summary.currency,recommendations:summary.recommendations,generatedAt:summary.asOf });
