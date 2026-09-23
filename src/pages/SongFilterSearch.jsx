import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";

import debounce from "lodash.debounce";

import SongFilterSearch from "../components/SongFilterSearch";
import BrowseSongLists from "../components/BrowseSongLists";

import "../assets/style/SongFilterSearchPage.css";

import { useNavigate } from "react-router-dom";

import { useData } from "../context/DataContext";


// ============================================================
// EMPTY FILTERS
// ============================================================

const EMPTY_FILTERS = {
  name: "",
  genre: "",
  language: "",
  singer: "",
  releaseYear: "",
};


// ============================================================
// CONVERT VALUE TO ID
// ============================================================

const toId = (value) => {
  if (value == null) {
    return "";
  }

  // Normal ObjectId string
  if (typeof value === "string") {
    return value;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(toId);
  }

  // MongoDB populated object
  if (typeof value === "object") {
    if (value._id != null) {
      return String(value._id);
    }

    return "";
  }

  return String(value);
};


// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalize = (value) => {
  return (value ?? "")
    .toString()
    .toLowerCase()
    .trim();
};


// ============================================================
// PAGE
// ============================================================

export default function SongFilterSearchPage() {

  const [filters, setFilters] =
    useState(EMPTY_FILTERS);


  // ==========================================================
  // DATA CONTEXT
  // ==========================================================

  const {
    songs: allSongs = [],
    filterOptions: options = {
      genres: [],
      languages: [],
      singers: [],
    },
    loading: dataLoading,
  } = useData();


  const navigate = useNavigate();


  // ==========================================================
  // DEBOUNCE SONG TITLE ONLY
  // ==========================================================

  const debouncedTitle = useMemo(
    () =>
      debounce((value) => {
        setFilters((previous) => ({
          ...previous,
          name: value,
        }));
      }, 300),
    []
  );


  // Cancel debounce when component unmounts
  useEffect(() => {
    return () => {
      debouncedTitle.cancel();
    };
  }, [debouncedTitle]);


  // ==========================================================
  // HANDLE FILTER CHANGE
  // ==========================================================

  const handleChange = useCallback(
    (e) => {
      const {
        name,
        value,
      } = e.target;


      // Song title is debounced
      if (name === "name") {
        debouncedTitle(value);
        return;
      }


      // Other filters update immediately
      setFilters((previous) => ({
        ...previous,
        [name]: value,
      }));
    },
    [debouncedTitle]
  );


  // ==========================================================
  // FILTER SONGS
  // ==========================================================

  const filteredSongs = useMemo(() => {

    const {
      name,
      genre,
      language,
      singer,
      releaseYear,
    } = filters;


    return allSongs.filter((song) => {

      // ======================================================
      // SONG TITLE
      // ======================================================

      if (name) {

        const title =
          song.title || "";

        if (
          !normalize(title).includes(
            normalize(name)
          )
        ) {
          return false;
        }
      }


      // ======================================================
      // GENRE
      // ======================================================

      if (genre) {

        const songGenreId =
          toId(song.genre);

        if (
          String(songGenreId) !==
          String(genre)
        ) {
          return false;
        }
      }


      // ======================================================
      // LANGUAGE
      // ======================================================

      if (language) {

        const songLanguageId =
          toId(song.language);

        if (
          String(songLanguageId) !==
          String(language)
        ) {
          return false;
        }
      }


      // ======================================================
      // SINGER
      // ======================================================

      if (singer) {

        /*
         * song.singers normally looks like:
         *
         * [
         *   { _id: "123", name: "Arijit Singh" },
         *   { _id: "456", name: "..." }
         * ]
         *
         * But this also safely handles:
         *
         * [
         *   "123",
         *   "456"
         * ]
         */

        const singerIds = (
          song.singers || []
        )
          .map(toId)
          .flat()
          .map(String);


        if (
          !singerIds.includes(
            String(singer)
          )
        ) {
          return false;
        }
      }


      // ======================================================
      // RELEASE YEAR
      // ======================================================

      if (releaseYear) {

        const songYear =
          song.releaseDate
            ? new Date(
                song.releaseDate
              ).getFullYear()
            : null;


        if (
          String(songYear) !==
          String(releaseYear)
        ) {
          return false;
        }
      }


      return true;
    });

  }, [allSongs, filters]);


  // ==========================================================
  // HAS SEARCHED
  // ==========================================================

  const hasSearched = useMemo(() => {

    return Object.values(filters).some(
      (value) =>
        value !== "" &&
        value != null
    );

  }, [filters]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <div
        className="sfs-page__back"
        onClick={() => navigate(-1)}
      >

        <div className="sfs-page__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>

        <span className="sfs-page__back-text">
          Back
        </span>

      </div>


      {/* ======================================================
          PAGE
      ====================================================== */}

      <div className="sfs-page">

        <h2 className="sfs-page__title">
          Filter Songs
        </h2>


        {/* ====================================================
            FILTER SECTION
        ==================================================== */}

        {dataLoading ? (

          <div className="sfs-page__loading">

            <div className="sfs-page__spinner"></div>

            <p>
              Loading filters...
            </p>

          </div>

        ) : (

          <SongFilterSearch
            filters={filters}
            options={options}
            handleChange={handleChange}
          />

        )}


        {/* ====================================================
            RESULTS
        ==================================================== */}

        <div className="sfs-results">

          <h3 className="sfs-results__title">

            Results

            {hasSearched &&
              filteredSongs.length > 0 && (

                <span className="sfs-results__count">
                  {filteredSongs.length} songs
                </span>

              )}

          </h3>


          <div className="sfs-results__content">

            {/* =================================================
                LOADING
            ================================================= */}

            {dataLoading ? (

              <div className="sfs-results__loading">

                <div className="sfs-page__spinner"></div>

                <p>
                  Loading songs...
                </p>

              </div>


            ) : !hasSearched ? (

              /* ===============================================
                 NOTHING SEARCHED
                 =============================================== */

              <div className="sfs-results__empty">

                <i className="fa-solid fa-magnifying-glass sfs-results__empty-icon"></i>

                <p>
                  Use the filters above to find songs
                </p>

              </div>


            ) : filteredSongs.length === 0 ? (

              /* ===============================================
                 NO RESULTS
                 =============================================== */

              <div className="sfs-results__empty">

                <i className="fa-solid fa-music sfs-results__empty-icon"></i>

                <p>
                  No songs found. Try adjusting your filters.
                </p>

              </div>


            ) : (

              /* ===============================================
                 RESULTS
                 =============================================== */

              <BrowseSongLists
                songs={filteredSongs}
              />

            )}

          </div>

        </div>

      </div>
    </>
  );
}