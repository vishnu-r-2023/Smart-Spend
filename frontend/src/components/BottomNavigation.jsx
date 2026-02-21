import React from "react";
import { PieChart as PieIcon, Calendar, Lightbulb, Filter } from "lucide-react";

const BottomNavigation = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bottom-nav">
      <div className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
        <PieIcon size={22} className="nav-icon" />
        <span className="nav-label">Dashboard</span>
      </div>
      <div className={`nav-item ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>
        <Calendar size={22} className="nav-icon" />
        <span className="nav-label">Transactions</span>
      </div>
      <div className={`nav-item ${activeTab === "insights" ? "active" : ""}`} onClick={() => setActiveTab("insights")}>
        <Lightbulb size={22} className="nav-icon" />
        <span className="nav-label">Insights</span>
      </div>
      <div className={`nav-item ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
        <Filter size={22} className="nav-icon" />
        <span className="nav-label">Profile</span>
      </div>
    </div>
  );
};

export default BottomNavigation;
