import test from "node:test";
import assert from "node:assert/strict";
import { buildFinancialSummary, parseTransactionDate } from "../services/financialAnalytics.js";

const tx = (date, amount, category = "Others", description = "entry", _id = undefined) => ({ date, amount, category, description, _id });
const now = new Date("2026-06-15T12:00:00.000Z");

test("parses the stored DD/MM/YYYY format and rejects invalid calendar dates", () => {
  assert.equal(parseTransactionDate("03/04/2026").toISOString(), "2026-04-03T00:00:00.000Z");
  assert.equal(parseTransactionDate("31/02/2026"), null);
  assert.equal(parseTransactionDate("not-a-date"), null);
});

test("aggregates signed income, expenses, savings, and category shares", () => {
  const summary = buildFinancialSummary({ now, transactions: [tx("02/06/2026", 5000, "Income"), tx("03/06/2026", -1200, "Food"), tx("04/06/2026", -800, "Transport")] });
  assert.equal(summary.current.income, 5000);
  assert.equal(summary.current.expenses, 2000);
  assert.equal(summary.current.netSavings, 3000);
  assert.equal(summary.current.savingsRate, 60);
  assert.deepEqual(summary.categories.map(({name, percentage}) => [name, percentage]), [["Food & Dining", 60], ["Transportation", 40]]);
});

test("handles empty history and zero income without fabricated savings rate", () => {
  const empty = buildFinancialSummary({ now, transactions: [] });
  assert.equal(empty.current.income, 0);
  assert.equal(empty.current.expenses, 0);
  assert.equal(empty.current.savingsRate, null);
  assert.deepEqual(empty.recommendations, []);
  const expensesOnly = buildFinancialSummary({ now, transactions: [tx("02/06/2026", -100, "Food")] });
  assert.equal(expensesOnly.current.netSavings, -100);
  assert.equal(expensesOnly.current.savingsRate, null);
});

test("compares matched date ranges and returns evidence for significant category increases", () => {
  const rows = [
    tx("20/05/2026", -1000, "Dining"), tx("22/05/2026", -1000, "Dining"),
    tx("02/06/2026", -1800, "Dining", "Cafe"), tx("08/06/2026", -1800, "Dining", "Restaurant")
  ];
  const summary = buildFinancialSummary({ now, transactions: rows });
  const insight = summary.recommendations.find((item) => item.type === "spending-increase");
  assert.ok(insight);
  assert.equal(insight.evidence.currentAmount, 3600);
  assert.equal(insight.evidence.previousAmount, 2000);
  assert.equal(insight.evidence.changePercent, 80);
});

test("does not compare a newly appearing category against a zero baseline", () => {
  const summary = buildFinancialSummary({ now, transactions: [tx("20/05/2026", -1000, "Food"), tx("22/05/2026", -1000, "Food"), tx("02/06/2026", -1000, "Travel"), tx("08/06/2026", -1000, "Travel")] });
  assert.equal(summary.recommendations.some((item) => item.type === "spending-increase"), false);
});

test("detects repeated monthly candidates but labels them as potential", () => {
  const summary = buildFinancialSummary({ now, transactions: [tx("15/03/2026", -499, "Subscriptions", "StreamCo monthly", "a"), tx("15/04/2026", -499, "Subscriptions", "StreamCo monthly", "b"), tx("15/05/2026", -499, "Subscriptions", "StreamCo monthly", "c"), tx("15/06/2026", -499, "Subscriptions", "StreamCo monthly", "d")] });
  const candidate = summary.recommendations.find((item) => item.type === "recurring-candidate");
  assert.ok(candidate);
  assert.equal(candidate.evidence.occurrenceCount, 4);
  assert.equal(candidate.confidence, "medium");
});

test("validates period and avoids treating individual records as analytic duplicates", () => {
  assert.throws(() => buildFinancialSummary({ period: "week", now }), /Invalid period/);
  const rows = [tx("02/06/2026", -250, "Food", "Coffee"), tx("02/06/2026", -250, "Food", "Coffee")];
  assert.equal(buildFinancialSummary({ now, transactions: rows }).current.expenses, 500);
});

test("positive refunds are included by sign because the current schema cannot classify them separately", () => {
  const summary = buildFinancialSummary({ now, transactions: [tx("02/06/2026", 250, "Others", "Refund")] });
  assert.equal(summary.current.income, 250);
  assert.equal(summary.current.savingsRate, 100);
});

test("does not flag a category anomaly before five prior category observations exist", () => {
  const rows = [
    tx("01/06/2026", -100, "Food"), tx("02/06/2026", -100, "Food"),
    tx("03/06/2026", -100, "Food"), tx("04/06/2026", -100, "Food"),
    tx("06/06/2026", -1200, "Food")
  ];
  const summary = buildFinancialSummary({ now, transactions: rows });
  assert.equal(summary.recommendations.some((item) => item.type === "unusual-transaction"), false);
});