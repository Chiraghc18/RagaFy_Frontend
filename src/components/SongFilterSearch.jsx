import React, { useState, useRef, useEffect } from "react";

export default function SongFilterSearch({ filters, options, handleChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  return (
    <div className="sfs-filter">
      {/* Song Title - Simple Text Input */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">Song Title</label>
        <div className="sfs-filter__search-wrapper">
          <input
            type="text"
            name="name"
            placeholder="Search by song title..."
            value={filters.name || ""}
            onChange={handleChange}
            className="sfs-filter__input"
          />
          <i className="sfs-filter__search-icon fa-solid fa-music"></i>
        </div>
      </div>

      {/* Row: Genre + Language */}
      <div className="sfs-filter__row">
        <ComboBoxField
          label="Genre"
          searchName="genreName"
          selectName="genre"
          options={options.genres || []}
          searchValue={filters.genreName || ""}
          selectValue={filters.genre || ""}
          onChange={handleChange}
          placeholder="Search or select genre..."
        />
        <ComboBoxField
          label="Language"
          searchName="languageName"
          selectName="language"
          options={options.languages || []}
          searchValue={filters.languageName || ""}
          selectValue={filters.language || ""}
          onChange={handleChange}
          placeholder="Search or select language..."
        />
      </div>

      {/* Row: Singer + Year */}
      <div className="sfs-filter__row">
        <ComboBoxField
          label="Singer"
          searchName="singerName"
          selectName="singer"
          options={options.singers || []}
          searchValue={filters.singerName || ""}
          selectValue={filters.singer || ""}
          onChange={handleChange}
          placeholder="Search or select singer..."
        />
        <div className="sfs-filter__field sfs-filter__field--half">
          <label className="sfs-filter__label">Release Year</label>
          <div className="sfs-filter__select-wrapper">
            <select
              name="releaseYear"
              value={filters.releaseYear || ""}
              onChange={handleChange}
              className="sfs-filter__select"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ComboBox Component - Shows suggestions as you type
function ComboBoxField({ label, searchName, selectName, options, searchValue, selectValue, onChange, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter options based on typed text
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes((searchValue || "").toLowerCase())
  );

  // Show dropdown when typing OR when focused and there are options
  const showDropdown = isFocused && filteredOptions.length > 0;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsFocused(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightIndex >= 0 && dropdownRef.current) {
      const highlighted = dropdownRef.current.querySelector('.sfs-combo__option--highlighted');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsFocused(true);
        setHighlightIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
          handleSelect(filteredOptions[highlightIndex]);
        }
        e.preventDefault();
        break;
      case "Escape":
        setIsFocused(false);
        setHighlightIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (option) => {
    onChange({ target: { name: searchName, value: option.name } });
    onChange({ target: { name: selectName, value: option._id } });
    setIsFocused(false);
    setHighlightIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    onChange(e);
    setIsFocused(true);
    setHighlightIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onChange({ target: { name: searchName, value: "" } });
    onChange({ target: { name: selectName, value: "" } });
    setHighlightIndex(-1);
    setIsFocused(true);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHighlightIndex(-1);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (isFocused) {
      setIsFocused(false);
    } else {
      setIsFocused(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="sfs-filter__field sfs-filter__field--half">
      <label className="sfs-filter__label">{label}</label>
      <div className="sfs-combo" ref={wrapperRef}>
        <div className="sfs-combo__input-wrap">
          <input
            ref={inputRef}
            type="text"
            name={searchName}
            placeholder={placeholder}
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="sfs-combo__input"
            autoComplete="off"
          />
          <div className="sfs-combo__icons">
            {searchValue && (
              <i 
                className="fa-solid fa-xmark sfs-combo__clear" 
                onMouseDown={handleClear}
              ></i>
            )}
            <i
              className={`fa-solid fa-chevron-down sfs-combo__arrow ${isFocused ? 'sfs-combo__arrow--open' : ''}`}
              onMouseDown={toggleDropdown}
            ></i>
          </div>
        </div>

        {showDropdown && (
          <div className="sfs-combo__dropdown" ref={dropdownRef}>
            {filteredOptions.map((option, index) => (
              <div
                key={option._id}
                className={`sfs-combo__option ${index === highlightIndex ? 'sfs-combo__option--highlighted' : ''} ${selectValue === option._id ? 'sfs-combo__option--selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                <span>{option.name}</span>
                {selectValue === option._id && (
                  <i className="fa-solid fa-check sfs-combo__check"></i>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Hidden select for form data */}
        <select
          name={selectName}
          value={selectValue}
          onChange={onChange}
          className="sfs-combo__hidden-select"
        >
          <option value="">All {label}s</option>
          {options.map((opt) => (
            <option key={opt._id} value={opt._id}>{opt.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}