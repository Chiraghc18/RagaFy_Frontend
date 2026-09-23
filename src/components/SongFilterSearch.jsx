import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
} from "react";

function SongFilterSearch({
  filters,
  options,
  handleChange,
}) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from(
      {
        length: currentYear - 1949,
      },
      (_, i) => currentYear - i
    );
  }, []);

  return (
    <div className="sfs-filter">

      {/* ================= SONG TITLE ================= */}
      <div className="sfs-filter__field">
        <label className="sfs-filter__label">
          Song Title
        </label>

        <div className="sfs-filter__search-wrapper">
          <input
            type="text"
            name="name"
            placeholder="Search by song title..."
            value={filters.name || ""}
            onChange={handleChange}
            className="sfs-filter__input"
            autoComplete="off"
          />

          <i className="sfs-filter__search-icon fa-solid fa-music"></i>
        </div>
      </div>

      {/* ================= GENRE + LANGUAGE ================= */}
      <div className="sfs-filter__row">

        <ComboBoxField
          label="Genre"
          selectName="genre"
          options={options.genres || []}
          selectValue={filters.genre || ""}
          onChange={handleChange}
          placeholder="Search or select genre..."
        />

        <ComboBoxField
          label="Language"
          selectName="language"
          options={options.languages || []}
          selectValue={filters.language || ""}
          onChange={handleChange}
          placeholder="Search or select language..."
        />

      </div>

      {/* ================= SINGER + YEAR ================= */}
      <div className="sfs-filter__row">

        <ComboBoxField
          label="Singer"
          selectName="singer"
          options={options.singers || []}
          selectValue={filters.singer || ""}
          onChange={handleChange}
          placeholder="Search or select singer..."
        />

        <div className="sfs-filter__field sfs-filter__field--half">

          <label className="sfs-filter__label">
            Release Year
          </label>

          <div className="sfs-filter__select-wrapper">

            <select
              name="releaseYear"
              value={filters.releaseYear || ""}
              onChange={handleChange}
              className="sfs-filter__select"
            >
              <option value="">
                All Years
              </option>

              {years.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

          </div>
        </div>

      </div>
    </div>
  );
}

export default memo(SongFilterSearch);


// ============================================================
// COMBO BOX
// ============================================================

function ComboBoxField({
  label,
  selectName,
  options,
  selectValue,
  onChange,
  placeholder,
}) {
  const [isFocused, setIsFocused] =
    useState(false);

  const [highlightIndex, setHighlightIndex] =
    useState(-1);

  const [query, setQuery] =
    useState("");

  const [openUpward, setOpenUpward] =
    useState(false);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);


  // ==========================================================
  // FIND SELECTED OPTION
  // ==========================================================

  const selectedOption = useMemo(() => {
    return options.find(
      (option) =>
        String(option._id) ===
        String(selectValue)
    );
  }, [options, selectValue]);


  // ==========================================================
  // INPUT DISPLAY VALUE
  // ==========================================================

  /*
   * When the combo is closed:
   *      show selected singer/genre/language
   *
   * When the combo is open:
   *      show search query
   *
   * This prevents the selected singer name from becoming
   * part of the next search.
   */

  const displayValue = isFocused
    ? query
    : selectedOption?.name || "";


  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const filteredOptions = useMemo(() => {
    const search = query
      .trim()
      .toLowerCase();

    if (!search) {
      return options;
    }

    return options.filter((option) =>
      String(option.name || "")
        .toLowerCase()
        .includes(search)
    );
  }, [options, query]);


  const showDropdown =
    isFocused &&
    filteredOptions.length > 0;


  // ==========================================================
  // CLOSE WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setIsFocused(false);
        setQuery("");
        setHighlightIndex(-1);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  // ==========================================================
  // KEEP HIGHLIGHTED OPTION VISIBLE
  // ==========================================================

  useEffect(() => {
    if (
      highlightIndex >= 0 &&
      dropdownRef.current
    ) {
      const element =
        dropdownRef.current.querySelector(
          ".sfs-combo__option--highlighted"
        );

      if (element) {
        element.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [highlightIndex]);


  // ==========================================================
  // SELECT OPTION
  // ==========================================================

  const handleSelect = (option) => {
    onChange({
      target: {
        name: selectName,
        value: option._id,
      },
    });

    setQuery("");
    setIsFocused(false);
    setHighlightIndex(-1);
  };


  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleInputChange = (e) => {
    const value = e.target.value;

    setQuery(value);

    setHighlightIndex(-1);

    /*
     * If a singer/genre/language was previously selected,
     * typing means we are searching for a new one.
     */
    if (selectValue) {
      onChange({
        target: {
          name: selectName,
          value: "",
        },
      });
    }

    setIsFocused(true);
  };


  // ==========================================================
  // INPUT FOCUS
  // ==========================================================

  const handleFocus = () => {
    setIsFocused(true);

    setHighlightIndex(-1);

    /*
     * Very important:
     *
     * If "Arijit Singh" is selected and the user clicks
     * the singer field, don't make "Arijit Singh" the
     * search query.
     *
     * Start with an empty search.
     */
    setQuery("");

    if (inputRef.current) {
      const rect =
        inputRef.current.getBoundingClientRect();

      const spaceBelow =
        window.innerHeight -
        rect.bottom;

      const DROPDOWN_HEIGHT = 280;

      setOpenUpward(
        spaceBelow < DROPDOWN_HEIGHT
      );
    }
  };


  // ==========================================================
  // CLEAR
  // ==========================================================

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();

    onChange({
      target: {
        name: selectName,
        value: "",
      },
    });

    setQuery("");

    setHighlightIndex(-1);

    setIsFocused(true);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };


  // ==========================================================
  // KEYBOARD NAVIGATION
  // ==========================================================

  const handleKeyDown = (e) => {
    if (!filteredOptions.length) {
      if (e.key === "Escape") {
        setIsFocused(false);
        setQuery("");
      }

      return;
    }

    switch (e.key) {

      case "ArrowDown":
        e.preventDefault();

        setIsFocused(true);

        setHighlightIndex((previous) =>
          previous <
          filteredOptions.length - 1
            ? previous + 1
            : 0
        );

        break;


      case "ArrowUp":
        e.preventDefault();

        setHighlightIndex((previous) =>
          previous > 0
            ? previous - 1
            : filteredOptions.length - 1
        );

        break;


      case "Enter":
        e.preventDefault();

        if (
          highlightIndex >= 0 &&
          filteredOptions[highlightIndex]
        ) {
          handleSelect(
            filteredOptions[
              highlightIndex
            ]
          );
        }

        break;


      case "Escape":
        e.preventDefault();

        setIsFocused(false);
        setQuery("");
        setHighlightIndex(-1);

        break;


      default:
        break;
    }
  };


  // ==========================================================
  // ARROW BUTTON
  // ==========================================================

  const handleArrowMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFocused) {
      setIsFocused(false);
      setQuery("");
      setHighlightIndex(-1);

      return;
    }

    setIsFocused(true);
    setQuery("");
    setHighlightIndex(-1);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="sfs-filter__field sfs-filter__field--half">

      <label className="sfs-filter__label">
        {label}
      </label>

      <div
        className="sfs-combo"
        ref={wrapperRef}
      >

        {/* ================= INPUT ================= */}

        <div className="sfs-combo__input-wrap">

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className="sfs-combo__input"
            autoComplete="off"
          />

          <div className="sfs-combo__icons">

            {(displayValue || selectValue) && (
              <i
                className="fa-solid fa-xmark sfs-combo__clear"
                onMouseDown={handleClear}
              ></i>
            )}

            <i
              className={`fa-solid fa-chevron-down sfs-combo__arrow ${
                isFocused
                  ? "sfs-combo__arrow--open"
                  : ""
              }`}
              onMouseDown={
                handleArrowMouseDown
              }
            ></i>

          </div>
        </div>


        {/* ================= DROPDOWN ================= */}

        {showDropdown && (
          <div
            className={`sfs-combo__dropdown ${
              openUpward
                ? "sfs-combo__dropdown--up"
                : ""
            }`}
            ref={dropdownRef}
          >

            {filteredOptions.map(
              (option, index) => (

                <div
                  key={option._id}
                  className={`sfs-combo__option ${
                    index === highlightIndex
                      ? "sfs-combo__option--highlighted"
                      : ""
                  } ${
                    String(selectValue) ===
                    String(option._id)
                      ? "sfs-combo__option--selected"
                      : ""
                  }`}
                  onMouseDown={(e) =>
                    e.preventDefault()
                  }
                  onClick={() =>
                    handleSelect(option)
                  }
                  onMouseEnter={() =>
                    setHighlightIndex(index)
                  }
                >

                  <span>
                    {option.name}
                  </span>

                  {String(selectValue) ===
                    String(option._id) && (
                    <i className="fa-solid fa-check sfs-combo__check"></i>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}