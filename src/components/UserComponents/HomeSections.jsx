import React, { useMemo, useRef, useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { useNavigate, Link } from "react-router-dom";
import "../../assets/style/UserPage/AllSongs.css";

// Rails pulled from filterOptions
const CATEGORY_RAILS = [
  { key: "genre", dataKey: "genres", label: "Genres", icon: "fa-music" },
  { key: "language", dataKey: "languages", label: "Languages", icon: "fa-language" },
  { key: "movie", dataKey: "movies", label: "Movies", icon: "fa-clapperboard" },
  { key: "singer", dataKey: "singers", label: "Singers", icon: "fa-microphone" },
  { key: "artist", dataKey: "artists", label: "Artists", icon: "fa-user-music" },
];

// ─────────────────────────────────────────────────────
// GENRE GROUPS — 7 rails, all 24 genres placed
// ─────────────────────────────────────────────────────
const GENRE_GROUPS = {
  // 1. Melody — emotional / classical / ballad-leaning
  melody: {
    key: "melody",
    label: "Melody",
    icon: "fa-music",
    genres: [
      "melody",
      "emotional",
      "folk-classical",
    ],
  },

  // 2. Melody & Romance — love songs
  melodyRomantic: {
    key: "melody-romantic",
    label: "Melody & Romance",
    icon: "fa-heart",
    genres: ["romantic", "romantic pop"],
  },

  // 3. Dance & Electronic
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

  // 4. Pop Collection — mainstream / upbeat / crowd-pleasers
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
    // Don't double-count romantic pop songs (they belong to Melody & Romance)
    excludeGenres: ["romantic pop"],
  },

  // 5. Devotional & Traditional
  devotional: {
    key: "devotional",
    label: "Devotional & Traditional",
    icon: "fa-om",
    genres: [
      "devotional",
      "epic folk-devotional",
    ],
  },

  // 6. Evergreen Classics
  evergreen: {
    key: "evergreen",
    label: "Evergreen Classics",
    icon: "fa-clock-rotate-left",
    genres: ["evergreen kannada songs"],
  },

  // 7. Jazz
  jazz: {
    key: "jazz",
    label: "Jazz",
    icon: "fa-music",
    genres: ["jazz"],
  },

  // 8. More to Explore — catch-all (should be empty unless a new genre is added)
  otherGenres: {
    key: "other-genres",
    label: "More to Explore",
    icon: "fa-compass",
    excludeGenres: [
      // Melody
      "melody",
      "emotional",
      "pathos",
      "epic folk ballad",
      "folk-classical",
      // Melody & Romance
      "romantic",
      "romantic pop",
      // Pop Collection
      "pop",
      "pop rock",
      "pop energetic",
      "pop emotional",
      "pop melodies",
      "item song",
      "mass",
      "hip-hop",
      // Dance & Electronic
      "electronic dance-pop",
      "electronic dance-rock",
      "folk-fusion",
      "folk-pop fusion",
      // Devotional & Traditional
      "devotional",
      "yakshagana",
      "epic folk-devotional",
      // Evergreen
      "evergreen kannada songs",
      // Jazz
      "jazz",
    ],
  },
};

// How many songs each rail picks per cycle
const RAIL_SIZE = 29;

// localStorage key for globally played song ids
const PLAYED_STORAGE_KEY = "ragafy_home_played_ids";

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// Fisher-Yates shuffle
function pickRandom(arr, n) {
  if (!arr || arr.length === 0) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Filter out played, then randomly pick n.
// Returns { picks, poolSize, exhausted }.
function pickUnplayed(pool, n, playedSet) {
  const poolSize = pool?.length || 0;
  if (poolSize === 0) {
    return { picks: [], poolSize: 0, exhausted: false };
  }
  const unplayed = pool.filter((s) => !playedSet.has(s._id));
  const picks = pickRandom(unplayed, n);
  return {
    picks,
    poolSize,
    exhausted: unplayed.length === 0,
  };
}

// ── localStorage helpers ──────────────────────────────
function loadPlayedIds() {
  try {
    const raw = localStorage.getItem(PLAYED_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function savePlayedIds(set) {
  try {
    localStorage.setItem(PLAYED_STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

// ── Genre matching ────────────────────────────────────
// Normalizes: lowercase, hyphens → spaces, collapse whitespace.
// Makes "Folk-Fusion" and "Folk Fusion" both match "folk fusion".
function getSongGenre(song) {
  const norm = (s) =>
    s.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();

  if (song.genre?.name) return norm(song.genre.name);
  if (Array.isArray(song.genres)) {
    return song.genres.map((g) => g?.name && norm(g.name)).filter(Boolean);
  }
  if (typeof song.genre === "string") return norm(song.genre);
  return "";
}

function songMatchesGenres(song, genreList) {
  const g = getSongGenre(song);
  const list = genreList.map((x) => x.toLowerCase().replace(/-/g, " "));
  if (Array.isArray(g)) return g.some((x) => list.includes(x));
  return list.includes(g);
}

function songMatchesExcludedGenres(song, excludeGenres) {
  const g = getSongGenre(song);
  const list = excludeGenres.map((x) => x.toLowerCase().replace(/-/g, " "));
  if (Array.isArray(g)) return g.some((x) => list.includes(x));
  return list.includes(g);
}

// ─────────────────────────────────────────────────────
// Rail (horizontal scroll container)
// ─────────────────────────────────────────────────────
function Rail({ items, renderItem }) {
  const railRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (railRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scrollRail = (direction) => {
    if (railRef.current) {
      const scrollAmount = railRef.current.clientWidth * 0.8;
      const newScrollPosition =
        railRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      railRef.current.scrollTo({ left: newScrollPosition, behavior: "smooth" });
      setTimeout(checkScroll, 100);
    }
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

      <div className="all-songs__rail" ref={railRef} onScroll={checkScroll}>
        {items.map((item, idx) => renderItem(item, idx))}
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

// Placeholder shown when all songs in a section have been played
function ExhaustedPlaceholder({ onReset }) {
  return (
    <div className="all-songs__exhausted">
      <div className="all-songs__exhausted-inner">
        <i className="fa-solid fa-circle-check all-songs__exhausted-icon"></i>
        <p className="all-songs__exhausted-title">You've heard them all</p>
        <p className="all-songs__exhausted-text">
          Hit <strong>Reset</strong> to start this section again.
        </p>
        <button className="all-songs__exhausted-btn" onClick={onReset}>
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────
export default function HomeSections() {
  const { songs, photos, playlists, filterOptions, queue } = useData();
  const { recentlyPlayedIds } = useGlobalPlayer();
  const navigate = useNavigate();

  // ── Global played tracking ──────────────────────────
  const [playedIds, setPlayedIds] = useState(() => loadPlayedIds());

  // Bumping this re-runs the pick memos → new random selection
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    savePlayedIds(playedIds);
  }, [playedIds]);

  // Auto-reset once 80% of all songs have been played
  useEffect(() => {
    if (songs.length === 0) return;
    if (playedIds.size >= Math.floor(songs.length * 0.8)) {
      setPlayedIds(new Set());
    }
  }, [playedIds, songs.length]);

  const markPlayed = (songId) => {
    if (!songId) return;
    setPlayedIds((prev) => {
      if (prev.has(songId)) return prev;
      const next = new Set(prev);
      next.add(songId);
      return next;
    });
  };

  const resetPlayed = () => {
    setPlayedIds(new Set());
  };

  const reloadSections = () => {
    setReloadKey((k) => k + 1);
  };

  // ── Made for you ────────────────────────────────────
  const madeForYouResult = useMemo(
    () => pickUnplayed(songs, RAIL_SIZE, playedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [songs, playedIds, reloadKey]
  );

  // ── Genre sections (7 rails) ────────────────────────
  // Order: Melody → Melody & Romance → Dance & Electronic →
  //        Pop Collection → Devotional & Traditional →
  //        Evergreen Classics → More to Explore
  const genreSections = useMemo(() => {
    const sections = [];

    // 1. Melody
    const melodyPool = songs.filter((song) =>
      songMatchesGenres(song, GENRE_GROUPS.melody.genres)
    );
    sections.push({
      ...GENRE_GROUPS.melody,
      ...pickUnplayed(melodyPool, RAIL_SIZE, playedIds),
    });

    // 2. Melody & Romance
    const melodyRomanticPool = songs.filter((song) =>
      songMatchesGenres(song, GENRE_GROUPS.melodyRomantic.genres)
    );
    sections.push({
      ...GENRE_GROUPS.melodyRomantic,
      ...pickUnplayed(melodyRomanticPool, RAIL_SIZE, playedIds),
    });

    // 3. Dance & Electronic
    const dancePool = songs.filter((song) =>
      songMatchesGenres(song, GENRE_GROUPS.danceElectronic.genres)
    );
    sections.push({
      ...GENRE_GROUPS.danceElectronic,
      ...pickUnplayed(dancePool, RAIL_SIZE, playedIds),
    });

    // 4. Pop Collection
    const popBasedPool = songs.filter((song) => {
      const matches = songMatchesGenres(song, GENRE_GROUPS.popBased.genres);
      const excluded = songMatchesExcludedGenres(
        song,
        GENRE_GROUPS.popBased.excludeGenres
      );
      return matches && !excluded;
    });
    sections.push({
      ...GENRE_GROUPS.popBased,
      ...pickUnplayed(popBasedPool, RAIL_SIZE, playedIds),
    });

    // 5. Devotional & Traditional
    const devotionalPool = songs.filter((song) =>
      songMatchesGenres(song, GENRE_GROUPS.devotional.genres)
    );
    sections.push({
      ...GENRE_GROUPS.devotional,
      ...pickUnplayed(devotionalPool, RAIL_SIZE, playedIds),
    });

    // 6. Evergreen Classics
    const evergreenPool = songs.filter((song) =>
      songMatchesGenres(song, GENRE_GROUPS.evergreen.genres)
    );
    sections.push({
      ...GENRE_GROUPS.evergreen,
      ...pickUnplayed(evergreenPool, RAIL_SIZE, playedIds),
    });

    // 7. More to Explore — catch-all
    const otherPool = songs.filter(
      (song) =>
        !songMatchesExcludedGenres(
          song,
          GENRE_GROUPS.otherGenres.excludeGenres
        )
    );
    sections.push({
      ...GENRE_GROUPS.otherGenres,
      ...pickUnplayed(otherPool, RAIL_SIZE, playedIds),
    });

    return sections;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs, playedIds, reloadKey]);

  // ── Jazz (own rail) ─────────────────────────────────
  const jazzPool = useMemo(
    () => songs.filter((song) => songMatchesGenres(song, ["jazz"])),
    [songs]
  );
  const jazzResult = useMemo(
    () => pickUnplayed(jazzPool, RAIL_SIZE, playedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jazzPool, playedIds, reloadKey]
  );

  // ── Recently played ────────────────────────────────
  const recentlyPlayed = useMemo(() => {
    return recentlyPlayedIds
      .map((id) => songs.find((s) => s._id === id))
      .filter(Boolean);
  }, [recentlyPlayedIds, songs]);

  // ── Navigation ─────────────────────────────────────
  const goToPlayer = (songList, startIndex) => {
    markPlayed(songList?.[startIndex]?._id);
    navigate("/player", { state: { songs: songList, startIndex } });
  };

  const goToCategory = (categoryKey, item) => {
    navigate("/browse", { state: { category: categoryKey, item } });
  };

  // ── Reusable song card ─────────────────────────────
  const renderSongCard = (song, idx, songList) => (
    <div
      key={song._id}
      className="all-songs__rail-card"
      onClick={() => goToPlayer(songList, idx)}
    >
      <div className="all-songs__rail-cover">
        {photos[song._id] ? (
          <img src={photos[song._id]} alt={song.title} />
        ) : (
          <div className="all-songs__image--placeholder">🎵</div>
        )}
      </div>
      <div className="all-songs__rail-title">{song.title}</div>
      <div className="all-songs__rail-sub">
        {song.artist?.name || song.singers?.[0]?.name || "Unknown"}
      </div>
    </div>
  );

  // ── Section renderer ───────────────────────────────
  // hides if poolSize === 0 (no matches at all),
  // shows placeholder if exhausted (all played),
  // otherwise shows the rail.
  const renderSection = (result, key, titleNode) => {
    if (result.poolSize === 0) return null;

    return (
      <div className="all-songs__rail-section" key={key}>
        <h2 className="all-songs__section-title">{titleNode}</h2>
        {result.exhausted ? (
          <ExhaustedPlaceholder onReset={resetPlayed} />
        ) : (
          <Rail
            items={result.picks}
            renderItem={(song, idx) =>
              renderSongCard(song, idx, result.picks)
            }
          />
        )}
      </div>
    );
  };

  return (
    <div className="home-sections">
      {/* Greeting + Reload (left) + Reset (right) */}
      <div className="all-songs__greeting">
        <button
          className="all-songs__reload-btn"
          onClick={reloadSections}
          aria-label="Reload sections"
          title="Reload sections"
        >
          <i className="fa-solid fa-arrows-rotate"></i> Reload
        </button>

        <p className="all-songs__eyebrow">{greeting()}</p>

        <button
          className="all-songs__reset-btn"
          onClick={resetPlayed}
          aria-label="Reset played songs"
          title="Reset played songs"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>

      {/* Made for you */}
      {renderSection(madeForYouResult, "made-for-you", "Made for you")}

      {/* Genre sections */}
      {genreSections.map((section) =>
        renderSection(
          section,
          section.key,
          <>
            <i className={`fa-solid ${section.icon}`}></i> {section.label}
          </>
        )
      )}

      {/* Jazz */}
      {renderSection(jazzResult, "jazz", "Jazz")}

      {/* Recently played */}
      {recentlyPlayed.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Recently played</h2>
          <Rail
            items={recentlyPlayed}
            renderItem={(song, idx) =>
              renderSongCard(song, idx, recentlyPlayed)
            }
          />
        </div>
      )}

      {/* Continue listening */}
      {queue && queue.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Continue listening</h2>
          <Rail
            items={queue.slice(0, 8)}
            renderItem={(song, idx) => renderSongCard(song, idx, queue)}
          />
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="all-songs__playlists">
          <h2 className="all-songs__section-title">Featured Playlists</h2>
          <div className="all-songs__playlist-container">
            {playlists.map((pl) => (
              <Link
                key={pl._id}
                to={`/user-playlists/${pl._id}`}
                className="all-songs__playlist-card"
              >
                <div className="all-songs__playlist-cover">
                  {pl.coverImage ? (
                    <img
                      src={pl.coverImage}
                      alt={pl.name}
                      className="all-songs__playlist-image"
                    />
                  ) : (
                    <div className="all-songs__playlist-placeholder">🎵</div>
                  )}
                </div>
                <div className="all-songs__playlist-name">{pl.name}</div>
                <div className="all-songs__playlist-count">
                  {pl.songs?.length || 0} songs
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category rails (unchanged) */}
      {CATEGORY_RAILS.map((rail) => {
        const items = filterOptions?.[rail.dataKey] || [];
        if (items.length === 0) return null;
        return (
          <div className="all-songs__rail-section" key={rail.key}>
            <div className="all-songs__section-head">
              <h2 className="all-songs__section-title">
                <i className={`fa-solid ${rail.icon}`}></i> {rail.label}
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
              renderItem={(item, idx) => (
                <div
                  key={item._id}
                  className="all-songs__pill-card"
                  onClick={() => goToCategory(rail.key, item)}
                >
                  <div className="all-songs__pill-cover">
                    {item.photo || item.imageUrl ? (
                      <img src={item.photo || item.imageUrl} alt={item.name} />
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