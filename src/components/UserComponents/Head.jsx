import React, { useState } from "react";
import "../../assets/style/UserPage/Head.css";
import HeadSearch from "../UserComponents/HeadSearch";

const Head = () => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      {!showSearch && (
        <header className="user-header">
          <h1 className="user-header-title">Discover</h1>
          <i
            className="fa-solid fa-magnifying-glass"
            onClick={() => setShowSearch(true)}
            style={{ cursor: "pointer" }}
          ></i>
        </header>
      )}

      {showSearch && <HeadSearch />}
    </>
  );
};

export default Head;
