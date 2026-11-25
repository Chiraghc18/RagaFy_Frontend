import React from "react";
import "../../assets/style/UserPage/Head.css";
import logo from "../../assets/images/logo/blend.png";

const Head = ({ onSearchClick }) => {
  return (
    <header className="head">
      {/* 🟢 Wrapped in <a> to force a full page reload on click */}
      <a href="/" className="head__left" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="head__logo-wrap">
          <img src={logo} alt="RagaFy" className="head__logo" />
        </div>
        <span className="head__brand-text">RagaFy Beats</span>
      </a>
      
      <div className="head__right" onClick={onSearchClick}>
        <span className="head__discover-text">Discover</span>
        <button className="head__search-btn" aria-label="Search">
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
    </header>
  );
};

export default Head;