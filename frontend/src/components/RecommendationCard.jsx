import React from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ChevronRight, CircleAlert, Info } from "lucide-react";

const RecommendationCard = ({ item, currency = "INR", onOpen }) => {
  const tone = item.priority === "high" || item.priority === "medium" ? "attention" : item.priority === "positive" ? "positive" : "neutral";
  const Icon = tone === "attention" ? CircleAlert : tone === "positive" ? CheckCircle2 : Info;
  const amount = (value) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
  return (
    <article className={`recommendation-card ${tone}`}>
      <div className="recommendation-icon"><Icon size={19} aria-hidden="true" /></div>
      <div className="recommendation-body">
        <div className="recommendation-heading"><h3>{item.title}</h3><span className="recommendation-period">{item.comparisonPeriod || "Observed pattern"}</span></div>
        <p className="recommendation-observation">{item.description}</p>
        {item.evidence && <div className="recommendation-evidence">
          {item.evidence.previousAmount != null && <span>Previous: {amount(item.evidence.previousAmount)}</span>}
          {item.evidence.currentAmount != null && <span>Current: {amount(item.evidence.currentAmount)}</span>}
          {item.evidence.changePercent != null && <span className={item.evidence.changePercent > 0 ? "negative-text" : "positive-text"}>{item.evidence.changePercent > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(item.evidence.changePercent)}%</span>}
          {item.evidence.percentage != null && <span>{item.evidence.percentage}% of expenses</span>}
          {item.evidence.totalAmount != null && <span>Recorded total: {amount(item.evidence.totalAmount)}</span>}
          {item.evidence.currentRate != null && <span>Savings rate: {item.evidence.previousRate}% → {item.evidence.currentRate}%</span>}
          {item.evidence.transactionAmount != null && <span>Transaction: {amount(item.evidence.transactionAmount)} · baseline {amount(item.evidence.categoryMedian)}</span>}
        </div>}
        <div className="recommendation-action"><span>{item.suggestedAction}</span><button type="button" onClick={() => onOpen?.(item.category)} aria-label={`View transactions related to ${item.title}`}>View activity <ChevronRight size={15} /></button></div>
      </div>
    </article>
  );
};
export default RecommendationCard;
