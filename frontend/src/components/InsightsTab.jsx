import React from "react";
import { Lightbulb } from "lucide-react";

const InsightsTab = ({ insights, savingsRate }) => {
  return (
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
        <div className="health-score-wrap">
          <div className="health-score-value">{Math.round(Math.min(100, savingsRate * 1.2))}</div>
          <div className="health-score-label">
            {savingsRate > 60
              ? "\uD83C\uDF89 Excellent"
              : savingsRate > 40
                ? "\uD83D\uDC4D Good"
                : savingsRate > 20
                  ? "\uD83D\uDCC8 Fair"
                  : "\u26A0\uFE0F Needs Work"}
          </div>
        </div>
      </div>
    </>
  );
};

export default InsightsTab;

