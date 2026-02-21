import React from "react";

const RefreshIndicator = ({ isRefreshing, pullDistance, pullReady }) => {
  const offset = Math.round(Math.min(pullDistance, 70));

  return (
    <div
      className={`refresh-indicator refresh-offset-${offset} ${pullDistance > 0 || isRefreshing ? "visible" : ""}`}
    >
      {isRefreshing ? (
        <>
          <span className="refresh-spinner" />
          Refreshing...
        </>
      ) : (
        <>
          <span className="refresh-spinner" />
          {pullReady ? "Release to refresh" : "Pull to refresh"}
        </>
      )}
    </div>
  );
};

export default RefreshIndicator;
