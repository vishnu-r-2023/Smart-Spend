import React from "react";
import { Lightbulb } from "lucide-react";
import RecommendationCard from "./RecommendationCard";
const InsightsTab = ({ analytics, currency, analyticsLoading, onOpenCategory }) => {
  const recommendations = analytics?.recommendations || [];
  return <section className="insights-page"><header className="dashboard-intro"><div><span className="eyebrow">PERSONALIZED ANALYSIS</span><h1>Insights & recommendations</h1><p>Each observation is calculated from your saved transactions.</p></div></header>
    {analyticsLoading && <div className="analytics-loading-line">Refreshing insights…</div>}
    {recommendations.length ? <div className="recommendation-list">{recommendations.map(item=><RecommendationCard key={item.id} item={item} currency={currency} onOpen={onOpenCategory}/>)}</div> : <div className="analytics-empty"><Lightbulb size={22}/><div><strong>{analytics?.totalTransactions ? "No actionable patterns yet" : "Start with your first transaction"}</strong><p>{analytics?.totalTransactions ? "More history may reveal useful changes or recurring activity." : "Your insights will be based on activity you add or import."}</p></div></div>}
  </section>;
};
export default InsightsTab;
