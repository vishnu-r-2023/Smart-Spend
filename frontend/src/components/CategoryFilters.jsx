import React from "react";

const CategoryFilters = ({ categoryFilters, selectedCategory, setSelectedCategory }) => {
  return (
    <div className="category-filters">
      {categoryFilters.map((cat) => (
        <div
          key={cat}
          className={`filter-chip ${selectedCategory === cat ? "active" : ""}`}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat}
        </div>
      ))}
    </div>
  );
};

export default CategoryFilters;
