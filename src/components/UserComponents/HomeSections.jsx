import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { useNavigate, Link } from "react-router-dom";
import "../../assets/style/UserPage/AllSongs.css";

// ─────────────────────────────────────────────────────
// HOW FAR BACK COUNTS AS "NEW"
// Change this single number to tune the window.
// ─────────────────────────────────────────────────────
const NEW_RELEASE_WINDOW_DAYS = 365;

// Rails pulled from filterOptions
const CATEGORY_RAILS = [
  { key: "genre", dataKey: "genres", label: "Genres", icon: "fa-music" },
  { key: "language", dataKey: "languages", label: "Languages", icon: "fa-language" },
  { key: "movie", dataKey: "movies", label: "Movies", icon: "fa-clapperboard" },
  { key: "singer", dataKey: "singers", label: "Singers", icon: "fa-microphone" },
  { key: "artist", dataKey: "artists", label: "Artists", icon: "fa-user-music" },
];

// ─────────────────────────────────────────────────────
// GENRE GROUPS
// ─────────────────────────────────────────────────────

const GENRE_GROUPS = {
  melody: {
    key: "melody",
    label: "Melody",
    icon: "fa-music",
    genres: ["melody", "emotional", "folk-classical"],
  },

  melodyRomantic: {
    key: "melody-romantic",
    label: "Melody & Romance",
    icon: "fa-heart",
    genres: ["romantic", "romantic pop"],
  },

  danceElectronic: {
    key: "dance-electronic",
    label: "Dance & Electronic",
    icon: "fa-bolt",
    genres: [
      "electronic dance-pop",
      "electronic dance-rock",
      "folk-fusion",
      "folk-pop fusion",
    ],
  },

  popBased: {
    key: "pop-based",
    label: "Pop Collection",
    icon: "fa-music",
    genres: [
      "pop",
      "pop rock",
      "pop energetic",
      "pop emotional",
      "pop melodies",
      "hip-hop",
    ],
    excludeGenres: ["romantic pop"],
  },

  devotional: {
    key: "devotional",
    label: "Devotional & Traditional",
    icon: "fa-om",
    genres: ["devotional", "epic folk-devotional"],
  },

  evergreen: {
    key: "evergreen",
    label: "Evergreen Classics",
    icon: "fa-clock-rotate-left",
    genres: ["evergreen kannada songs"],
  },

  jazz: {
    key: "jazz",
    label: "Jazz",
    icon: "fa-music",
    genres: ["jazz"],
  },

  otherGenres: {
    key: "other-genres",
    label: "More to Explore",
    icon: "fa-compass",
    excludeGenres: [
      "melody",
      "emotional",
      "pathos",
      "epic folk ballad",
      "folk-classical",
      "romantic",
      "romantic pop",
      "pop",
      "pop rock",
      "pop energetic",
      "pop emotional",
      "pop melodies",
      "item song",
      "mass",
      "hip-hop",
      "electronic dance-pop",
      "electronic dance-rock",
      "folk-fusion",
      "folk-pop fusion",
      "devotional",
      "yakshagana",
      "epic folk-devotional",
      "evergreen kannada songs",
      "jazz",
    ],
  },
};

const RAIL_SIZE = 29;

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function greeting() {
  const hour = new Date().getHours();

  if (hour < 5) return "Still up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";

  return "Good night";
}

// Fisher-Yates shuffle
function pickRandom(arr, count) {
  if (!arr || arr.length === 0) return [];

  const copy = [...arr];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}

// Filter out played songs, then randomly pick songs
function pickUnplayed(pool, count, playedSet) {
  const poolSize = pool?.length || 0;

  if (poolSize === 0) {
    return {
      picks: [],
      poolSize: 0,
      exhausted: false,
    };
  }

  const unplayed = pool.filter(
    (song) => !playedSet.has(song._id)
  );

  const picks = pickRandom(unplayed, count);

  return {
    picks,
    poolSize,
    exhausted: unplayed.length === 0,
  };
}

// ─────────────────────────────────────────────────────
// RELEASE DATE HELPERS
// ─────────────────────────────────────────────────────

/**
 * Resolve a song's release date into a millisecond timestamp.
 * Returns NaN if no usable date is present.
 */
function getSongReleaseTimestamp(song) {
  if (!song) return NaN;

  const raw =
    song.releaseDate ||
    song.releasedAt ||
    song.release_date ||
    song.releasedOn ||
    null;

  if (!raw) return NaN;

  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : NaN;
}

/**
 * Filter songs to those released within the last `days` days.
 * Songs without a valid release date are dropped.
 * Returned newest-first.
 */
function getNewReleases(songs, days) {
  if (!songs?.length) return [];

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return songs
    .map((song) => ({
      song,
      ts: getSongReleaseTimestamp(song),
    }))
    .filter(({ ts }) => Number.isFinite(ts) && ts >= cutoff)
    .sort((a, b) => b.ts - a.ts)
    .map(({ song }) => song);
}

// ─────────────────────────────────────────────────────
// GENRE MATCHING
// ─────────────────────────────────────────────────────

function normalizeGenre(value) {
  return value
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSongGenre(song) {
  if (song.genre?.name) {
    return normalizeGenre(song.genre.name);
  }

  if (Array.isArray(song.genres)) {
    return song.genres
      .map((genre) =>
        genre?.name ? normalizeGenre(genre.name) : ""
      )
      .filter(Boolean);
  }

  if (typeof song.genre === "string") {
    return normalizeGenre(song.genre);
  }

  return "";
}

function songMatchesGenres(song, genreList) {
  const songGenre = getSongGenre(song);

  const normalizedList = genreList.map(normalizeGenre);

  if (Array.isArray(songGenre)) {
    return songGenre.some((genre) =>
      normalizedList.includes(genre)
    );
  }

  return normalizedList.includes(songGenre);
}

function songMatchesExcludedGenres(song, excludeGenres) {
  const songGenre = getSongGenre(song);

  const normalizedList = excludeGenres.map(normalizeGenre);

  if (Array.isArray(songGenre)) {
    return songGenre.some((genre) =>
      normalizedList.includes(genre)
    );
  }

  return normalizedList.includes(songGenre);
}

// ─────────────────────────────────────────────────────
// RAIL — HORIZONTAL SCROLL CONTAINER
// ─────────────────────────────────────────────────────

function Rail({ items, renderItem }) {
  const railRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!railRef.current) return;

    const {
      scrollLeft,
      scrollWidth,
      clientWidth,
    } = railRef.current;

    setCanScrollLeft(scrollLeft > 0);

    setCanScrollRight(
      scrollLeft + clientWidth < scrollWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();

    window.addEventListener("resize", checkScroll);

    return () => {
      window.removeEventListener("resize", checkScroll);
    };
  }, [items]);

  const scrollRail = (direction) => {
    if (!railRef.current) return;

    const scrollAmount = railRef.current.clientWidth * 0.8;

    const newScrollPosition =
      railRef.current.scrollLeft +
      (direction === "right"
        ? scrollAmount
        : -scrollAmount);

    railRef.current.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });

    setTimeout(checkScroll, 100);
  };

  return (
    <div className="all-songs__rail-wrapper">
      {canScrollLeft && (
        <button
          className="all-songs__scroll-btn all-songs__scroll-btn--left"
          onClick={() => scrollRail("left")}
          aria-label="Scroll left"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
      )}

      <div
        className="all-songs__rail"
        ref={railRef}
        onScroll={checkScroll}
      >
        {items.map((item, index) =>
          renderItem(item, index)
        )}
      </div>

      {canScrollRight && (
        <button
          className="all-songs__scroll-btn all-songs__scroll-btn--right"
          onClick={() => scrollRail("right")}
          aria-label="Scroll right"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// EXHAUSTED SECTION PLACEHOLDER
// ─────────────────────────────────────────────────────

function ExhaustedPlaceholder({ onReset }) {
  return (
    <div className="all-songs__exhausted">
      <div className="all-songs__exhausted-inner">
        <i className="fa-solid fa-circle-check all-songs__exhausted-icon"></i>

        <p className="all-songs__exhausted-title">
          You've heard them all
        </p>

        <p className="all-songs__exhausted-text">
          Hit <strong>Reset</strong> to start this section again.
        </p>

        <button
          className="all-songs__exhausted-btn"
          onClick={onReset}
        >
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────

export default function HomeSections() {
  const {
    songs = [],
    photos = {},
    playlists = [],
    filterOptions = {},
    queue = [],
  } = useData();

  const {
    recentlyPlayedIds,
    playedSongIds,
    resetPlayed,
    resetPlayedSubset,
    currentPlaylist,
    addToPlaylist,
  } = useGlobalPlayer();

  const navigate = useNavigate();

  // Convert global played history to a Set for efficient lookups.
  const playedIds = useMemo(
    () => new Set(playedSongIds),
    [playedSongIds]
  );

  // Set of song IDs currently in the queue (for the "vanish when queued" button)
  const queuedIds = useMemo(
    () => new Set(currentPlaylist.map((s) => s._id)),
    [currentPlaylist]
  );

  // Bumping this value generates a new random selection.
  const [reloadKey, setReloadKey] = useState(0);

  // ───────────────────────────────────────────────────
  // AUTO-RESET AT 80% OF THE FULL CATALOGUE
  // ───────────────────────────────────────────────────

  useEffect(() => {
    if (!songs.length) return;

    const catalogueIds = new Set(
      songs.map((song) => song._id)
    );

    const validPlayedIds = new Set(
      playedSongIds.filter((id) => catalogueIds.has(id))
    );

    const resetThreshold = Math.ceil(songs.length * 0.8);

    if (validPlayedIds.size >= resetThreshold) {
      resetPlayed();
    }
  }, [songs, playedSongIds, resetPlayed]);

  // ───────────────────────────────────────────────────
  // RELOAD SECTIONS
  // ───────────────────────────────────────────────────

  const reloadSections = () => {
    setReloadKey((previous) => previous + 1);
  };

  // ───────────────────────────────────────────────────
  // MADE FOR YOU — NEW RELEASES ONLY
  // ───────────────────────────────────────────────────

  // All songs within the new-release window (ignores played state).
  // Kept separate so the scoped reset can reference the exact same pool.
  const newReleasesPool = useMemo(
    () => getNewReleases(songs, NEW_RELEASE_WINDOW_DAYS),
    [songs]
  );

  const madeForYouResult = useMemo(
    () => pickUnplayed(newReleasesPool, RAIL_SIZE, playedIds),
    [newReleasesPool, playedIds, reloadKey]
  );

  // Scoped reset: only clears play history for songs in the new-release window
  const resetMadeForYou = useCallback(() => {
    resetPlayedSubset(newReleasesPool.map((song) => song._id));
  }, [newReleasesPool, resetPlayedSubset]);

  // ───────────────────────────────────────────────────
  // GENRE SECTIONS
  // ───────────────────────────────────────────────────

  const genreSections = useMemo(() => {
    const sections = [];

    // 1. Melody
    const melodyPool = songs.filter((song) =>
      songMatchesGenres(
        song,
        GENRE_GROUPS.melody.genres
      )
    );

    sections.push({
      ...GENRE_GROUPS.melody,
      ...pickUnplayed(
        melodyPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 2. Melody & Romance
    const melodyRomanticPool = songs.filter((song) =>
      songMatchesGenres(
        song,
        GENRE_GROUPS.melodyRomantic.genres
      )
    );

    sections.push({
      ...GENRE_GROUPS.melodyRomantic,
      ...pickUnplayed(
        melodyRomanticPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 3. Dance & Electronic
    const dancePool = songs.filter((song) =>
      songMatchesGenres(
        song,
        GENRE_GROUPS.danceElectronic.genres
      )
    );

    sections.push({
      ...GENRE_GROUPS.danceElectronic,
      ...pickUnplayed(
        dancePool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 4. Pop Collection
    const popBasedPool = songs.filter((song) => {
      const matches = songMatchesGenres(
        song,
        GENRE_GROUPS.popBased.genres
      );

      const excluded = songMatchesExcludedGenres(
        song,
        GENRE_GROUPS.popBased.excludeGenres
      );

      return matches && !excluded;
    });

    sections.push({
      ...GENRE_GROUPS.popBased,
      ...pickUnplayed(
        popBasedPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 5. Devotional & Traditional
    const devotionalPool = songs.filter((song) =>
      songMatchesGenres(
        song,
        GENRE_GROUPS.devotional.genres
      )
    );

    sections.push({
      ...GENRE_GROUPS.devotional,
      ...pickUnplayed(
        devotionalPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 6. Evergreen Classics
    const evergreenPool = songs.filter((song) =>
      songMatchesGenres(
        song,
        GENRE_GROUPS.evergreen.genres
      )
    );

    sections.push({
      ...GENRE_GROUPS.evergreen,
      ...pickUnplayed(
        evergreenPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    // 7. More to Explore
    const otherPool = songs.filter(
      (song) =>
        !songMatchesExcludedGenres(
          song,
          GENRE_GROUPS.otherGenres.excludeGenres
        )
    );

    sections.push({
      ...GENRE_GROUPS.otherGenres,
      ...pickUnplayed(
        otherPool,
        RAIL_SIZE,
        playedIds
      ),
    });

    return sections;
  }, [songs, playedIds, reloadKey]);

  // ───────────────────────────────────────────────────
  // JAZZ
  // ───────────────────────────────────────────────────

  const jazzPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, ["jazz"])
      ),
    [songs]
  );

  const jazzResult = useMemo(
    () => pickUnplayed(jazzPool, RAIL_SIZE, playedIds),
    [jazzPool, playedIds, reloadKey]
  );

  // ───────────────────────────────────────────────────
  // RECENTLY PLAYED
  // ───────────────────────────────────────────────────

  const recentlyPlayed = useMemo(() => {
    return recentlyPlayedIds
      .map((id) =>
        songs.find((song) => song._id === id)
      )
      .filter(Boolean);
  }, [recentlyPlayedIds, songs]);

  // ───────────────────────────────────────────────────
  // NAVIGATION
  // ───────────────────────────────────────────────────

  const goToPlayer = (songList, startIndex) => {
    if (!songList?.length || startIndex < 0) return;

    navigate("/player", {
      state: {
        songs: songList,
        startIndex,
      },
    });
  };

  const goToCategory = (categoryKey, item) => {
    navigate("/browse", {
      state: {
        category: categoryKey,
        item,
      },
    });
  };

  // ───────────────────────────────────────────────────
  // ADD ENTIRE SECTION TO QUEUE
  // ───────────────────────────────────────────────────

  const showNotification = (message, color) => {
    const notification = document.createElement("div");
    notification.className = "all-songs__notification";
    notification.textContent = message;
    notification.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleAddSectionToQueue = (e, songList) => {
    e.stopPropagation();
    if (!songList?.length) return;

    const notQueued = songList.filter(
      (song) => !queuedIds.has(song._id)
    );

    if (notQueued.length === 0) return;

    addToPlaylist(notQueued);

    showNotification(
      `＋ Added ${notQueued.length} song${
        notQueued.length === 1 ? "" : "s"
      } to queue`,
      "#4CAF50"
    );
  };

  // ───────────────────────────────────────────────────
  // REUSABLE SONG CARD
  // ───────────────────────────────────────────────────

  const renderSongCard = (song, index, songList) => (
    <div
      key={song._id}
      className="all-songs__rail-card"
      onClick={() => goToPlayer(songList, index)}
    >
      <div className="all-songs__rail-cover">
        {photos[song._id] ? (
          <img
            src={photos[song._id]}
            alt={song.title}
          />
        ) : (
          <div className="all-songs__image--placeholder">
            🎵
          </div>
        )}
      </div>

      <div className="all-songs__rail-title">
        {song.title}
      </div>

      <div className="all-songs__rail-sub">
        {song.artist?.name ||
          song.singers?.[0]?.name ||
          " "}
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────
  // SECTION RENDERER
  // ───────────────────────────────────────────────────

  const renderSection = (result, key, titleNode, onResetOverride) => {
    if (result.poolSize === 0) return null;

    const allQueued =
      result.picks.length > 0 &&
      result.picks.every((song) => queuedIds.has(song._id));

    return (
      <div
        className="all-songs__rail-section"
        key={key}
      >
        <div className="all-songs__section-head">
          <h2 className="all-songs__section-title">
            {titleNode}
          </h2>

          {!result.exhausted && !allQueued && (
            <button
              className="all-songs__add-section-btn"
              onClick={(e) =>
                handleAddSectionToQueue(e, result.picks)
              }
              title="Add this section to queue"
            >
              <i className="fa-solid fa-plus"></i>
              Add all
            </button>
          )}
        </div>

        {result.exhausted ? (
          <ExhaustedPlaceholder
            onReset={onResetOverride || resetPlayed}
          />
        ) : (
          <Rail
            items={result.picks}
            renderItem={(song, index) =>
              renderSongCard(
                song,
                index,
                result.picks
              )
            }
          />
        )}
      </div>
    );
  };

  // ───────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────

  return (
    <div className="home-sections">
      {/* Greeting + Reload + Reset */}
      <div className="all-songs__greeting">
        <button
          className="all-songs__reload-btn"
          onClick={reloadSections}
          aria-label="Reload sections"
          title="Reload sections"
        >
          <i className="fa-solid fa-arrows-rotate"></i>{" "}
          Reload
        </button>

        <p className="all-songs__eyebrow">
          {greeting()}
        </p>

        <button
          className="all-songs__reset-btn"
          onClick={resetPlayed}
          aria-label="Reset played songs"
          title="Reset played songs"
        >
          <i className="fa-solid fa-rotate-left"></i>{" "}
          Reset
        </button>
      </div>

      {/* Made for you — new releases only, with scoped reset */}
      {renderSection(
        madeForYouResult,
        "made-for-you",
        "Made for you",
        resetMadeForYou
      )}

      {/* Genre sections */}
      {genreSections.map((section) =>
        renderSection(
          section,
          section.key,
          <>
            <i className={`fa-solid ${section.icon}`}></i>{" "}
            {section.label}
          </>
        )
      )}

      {/* Jazz */}
      {renderSection(
        jazzResult,
        "jazz",
        "Jazz"
      )}

      {/* Recently played */}
      {recentlyPlayed.length > 0 && (
        <div className="all-songs__rail-section">
          <div className="all-songs__section-head">
            <h2 className="all-songs__section-title">
              Recently played
            </h2>

            {!recentlyPlayed.every((song) =>
              queuedIds.has(song._id)
            ) && (
              <button
                className="all-songs__add-section-btn"
                onClick={(e) =>
                  handleAddSectionToQueue(e, recentlyPlayed)
                }
                title="Add this section to queue"
              >
                <i className="fa-solid fa-plus"></i>
                Add all
              </button>
            )}
          </div>

          <Rail
            items={recentlyPlayed}
            renderItem={(song, index) =>
              renderSongCard(
                song,
                index,
                recentlyPlayed
              )
            }
          />
        </div>
      )}

      {/* Continue listening */}
      {queue.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">
            Continue listening
          </h2>

          <Rail
            items={queue.slice(0, 8)}
            renderItem={(song, index) =>
              renderSongCard(
                song,
                index,
                queue
              )
            }
          />
        </div>
      )}

      {/* Featured Playlists */}
      {playlists.length > 0 && (
        <div className="all-songs__playlists">
          <h2 className="all-songs__section-title">
            Featured Playlists
          </h2>

          <div className="all-songs__playlist-container">
            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/user-playlists/${playlist._id}`}
                className="all-songs__playlist-card"
              >
                <div className="all-songs__playlist-cover">
                  {playlist.coverImage ? (
                    <img
                      src={playlist.coverImage}
                      alt={playlist.name}
                      className="all-songs__playlist-image"
                    />
                  ) : (
                    <div className="all-songs__playlist-placeholder">
                      🎵
                    </div>
                  )}
                </div>

                <div className="all-songs__playlist-name">
                  {playlist.name}
                </div>

                <div className="all-songs__playlist-count">
                  {playlist.songs?.length || 0} songs
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category rails */}
      {CATEGORY_RAILS.map((rail) => {
        const items = filterOptions?.[rail.dataKey] || [];

        if (items.length === 0) return null;

        return (
          <div
            className="all-songs__rail-section"
            key={rail.key}
          >
            <div className="all-songs__section-head">
              <h2 className="all-songs__section-title">
                <i className={`fa-solid ${rail.icon}`}></i>{" "}
                {rail.label}
              </h2>

              <button
                className="all-songs__see-all"
                onClick={() => goToCategory(rail.key)}
              >
                See all
              </button>
            </div>

            <Rail
              items={items.slice(0, 12)}
              renderItem={(item) => (
                <div
                  key={item._id}
                  className="all-songs__pill-card"
                  onClick={() =>
                    goToCategory(rail.key, item)
                  }
                >
                  <div className="all-songs__pill-cover">
                    {item.photo || item.imageUrl ? (
                      <img
                        src={item.photo || item.imageUrl}
                        alt={item.name}
                      />
                    ) : (
                      <i className={`fa-solid ${rail.icon}`}></i>
                    )}
                  </div>

                  <span>{item.name}</span>
                </div>
              )}
            />
          </div>
        );
      })}
    </div>
  );
}