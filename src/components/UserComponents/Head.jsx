import React from "react";
import "../../assets/style/UserPage/Head.css";
import logo from "../../assets/images/logo/blend.png";

const Head = ({ onSearchClick }) => {
  return (
    <header className="head">
      <div className="head__left">
        <div className="head__logo-wrap">
          <img src={logo} alt="RagaFy" className="head__logo" />
        </div>
        <span className="head__brand-text">RagaFy Beats</span>
      </div>
      
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