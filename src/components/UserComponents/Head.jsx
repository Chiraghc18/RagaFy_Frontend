import React from "react";
import "../../assets/style/UserPage/Head.css";

const Head = ({ onSearchClick }) => {
  return (
    <header className="user-header">
      <h1 className="user-header-title">Discover</h1>
      <i
        className="fa-solid fa-magnifying-glass"
        onClick={onSearchClick}
        style={{ cursor: "pointer" }}
      ></i>
    </header>
  );
};

export default Head;
