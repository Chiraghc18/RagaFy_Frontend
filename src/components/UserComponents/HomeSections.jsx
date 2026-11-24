import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { useNavigate, Link } from "react-router-dom";
import "../../assets/style/UserPage/AllSongs.css";

// ─────────────────────────────────────────────────────
// HOW FAR BACK COUNTS AS "NEW"
// ─────────────────────────────────────────────────────
const NEW_RELEASE_WINDOW_DAYS = 400;

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

const RAIL_SIZE = 30;

// ─── Per-section auto-reset ───
const AUTO_RESET_RATIO = 0.8;
const AUTO_RESET_DAYS = 12;
const AUTO_RESET_DELAY_MS = AUTO_RESET_DAYS * 24 * 60 * 60 * 1000; // 12 days in ms
const AUTO_RESET_MIN_POOL = 30; // skip tiny pools (they'd thrash)
const AUTO_RESET_STORAGE_PREFIX = "autoreset:";

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
// RELEASE-DATE TIERS (priority order)
// ─────────────────────────────────────────────────────

const RELEASE_TIERS = [
  { key: "last3", minDays: 0, maxDays: 365 * 3 },
  { key: "3to7", minDays: 365 * 3, maxDays: 365 * 7 },
  { key: "7to10", minDays: 365 * 7, maxDays: 365 * 10 },
  { key: "older", minDays: 365 * 10, maxDays: Infinity },
];

/**
 * Assign a song to a tier based on its release date.
 * Songs without a valid date fall into "older" (lowest priority).
 */
function getSongTier(song) {
  const ts = getSongReleaseTimestamp(song);

  if (!Number.isFinite(ts)) return "older";

  const ageDays = (Date.now() - ts) / (24 * 60 * 60 * 1000);

  for (const tier of RELEASE_TIERS) {
    if (ageDays >= tier.minDays && ageDays < tier.maxDays) {
      return tier.key;
    }
  }
  return "older";
}

/**
 * ORIGINAL selection — fully random across the whole pool.
 * Used by: More to Explore, Devotional & Traditional, Jazz.
 */
function pickUnplayedRandom(pool, count, playedSet) {
  const poolSize = pool?.length || 0;

  if (poolSize === 0) {
    return { picks: [], poolSize: 0, exhausted: false };
  }

  const unplayed = pool.filter((song) => !playedSet.has(song._id));
  const picks = pickRandom(unplayed, count);

  return {
    picks,
    poolSize,
    exhausted: unplayed.length === 0,
  };
}

/**
 * MADE-FOR-YOU selection — random, backfill ONLY when short.
 */
function pickUnplayedWithBackfill(pool, count, playedSet) {
  const poolSize = pool?.length || 0;

  if (poolSize === 0) {
    return { picks: [], poolSize: 0, exhausted: false };
  }

  const unplayed = [];
  const played = [];

  for (const song of pool) {
    if (playedSet.has(song._id)) {
      played.push(song);
    } else {
      unplayed.push(song);
    }
  }

  // ── Case 1: enough unplayed songs → use only unplayed ──
  if (unplayed.length >= count) {
    const picks = pickRandom(unplayed, count);
    return { picks, poolSize, exhausted: false };
  }

  // ── Case 2: not enough unplayed → backfill with played ──
  const stillNeeded = count - unplayed.length;

  const backfill = pickRandom(played, stillNeeded);

  // Shuffle unplayed + backfill together so played songs
  // can appear anywhere in the rail.
  const combined = [...unplayed, ...backfill];
  const picks = pickRandom(combined, combined.length);

  return { picks, poolSize, exhausted: false };
}

/**
 * TIERED selection — progressive priority fill.
 * Used by: Melody, Melody & Romance, Dance & Electronic,
 *          Pop Collection, Evergreen Classics.
 */
function pickUnplayedTiered(pool, count, playedSet) {
  const poolSize = pool?.length || 0;

  if (poolSize === 0) {
    return { picks: [], poolSize: 0, exhausted: false };
  }

  const unplayed = pool.filter((song) => !playedSet.has(song._id));

  if (unplayed.length === 0) {
    return { picks: [], poolSize, exhausted: true };
  }

  const buckets = {
    last3: [],
    "3to7": [],
    "7to10": [],
    older: [],
  };

  for (const song of unplayed) {
    buckets[getSongTier(song)].push(song);
  }

  const picks = [];
  const tierOrder = ["last3", "3to7", "7to10", "older"];

  for (const tierKey of tierOrder) {
    const bucket = buckets[tierKey];
    if (bucket.length === 0) continue;

    const shuffled = [...bucket];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const remaining = count - picks.length;
    picks.push(...shuffled.slice(0, remaining));

    if (picks.length >= count) break;
  }

  return {
    picks,
    poolSize,
    exhausted: false,
  };
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
  // RELOAD SECTIONS
  // ───────────────────────────────────────────────────

  const reloadSections = () => {
    setReloadKey((previous) => previous + 1);
  };

  // ───────────────────────────────────────────────────
  // INDEPENDENT SECTION POOLS
  // ───────────────────────────────────────────────────

  const newReleasesPool = useMemo(
    () => getNewReleases(songs, NEW_RELEASE_WINDOW_DAYS),
    [songs]
  );

  const melodyPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, GENRE_GROUPS.melody.genres)
      ),
    [songs]
  );

  const melodyRomanticPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, GENRE_GROUPS.melodyRomantic.genres)
      ),
    [songs]
  );

  const dancePool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, GENRE_GROUPS.danceElectronic.genres)
      ),
    [songs]
  );

  const popBasedPool = useMemo(
    () =>
      songs.filter((song) => {
        const matches = songMatchesGenres(
          song,
          GENRE_GROUPS.popBased.genres
        );

        const excluded = songMatchesExcludedGenres(
          song,
          GENRE_GROUPS.popBased.excludeGenres
        );

        return matches && !excluded;
      }),
    [songs]
  );

  const devotionalPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, GENRE_GROUPS.devotional.genres)
      ),
    [songs]
  );

  const evergreenPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, GENRE_GROUPS.evergreen.genres)
      ),
    [songs]
  );

  const otherPool = useMemo(
    () =>
      songs.filter(
        (song) =>
          !songMatchesExcludedGenres(
            song,
            GENRE_GROUPS.otherGenres.excludeGenres
          )
      ),
    [songs]
  );

  const jazzPool = useMemo(
    () =>
      songs.filter((song) =>
        songMatchesGenres(song, ["jazz"])
      ),
    [songs]
  );

  // ───────────────────────────────────────────────────
  // INDEPENDENT SECTION RESULTS
  // ───────────────────────────────────────────────────

  const madeForYouResult = useMemo(
    () => pickUnplayedWithBackfill(newReleasesPool, RAIL_SIZE, playedIds),
    [newReleasesPool, playedIds, reloadKey]
  );

  const melodyResult = useMemo(
    () => pickUnplayedTiered(melodyPool, RAIL_SIZE, playedIds),
    [melodyPool, playedIds, reloadKey]
  );

  const melodyRomanticResult = useMemo(
    () => pickUnplayedTiered(melodyRomanticPool, RAIL_SIZE, playedIds),
    [melodyRomanticPool, playedIds, reloadKey]
  );

  const danceResult = useMemo(
    () => pickUnplayedTiered(dancePool, RAIL_SIZE, playedIds),
    [dancePool, playedIds, reloadKey]
  );

  const popBasedResult = useMemo(
    () => pickUnplayedTiered(popBasedPool, RAIL_SIZE, playedIds),
    [popBasedPool, playedIds, reloadKey]
  );

  const devotionalResult = useMemo(
    () => pickUnplayedRandom(devotionalPool, RAIL_SIZE, playedIds),
    [devotionalPool, playedIds, reloadKey]
  );

  const evergreenResult = useMemo(
    () => pickUnplayedTiered(evergreenPool, RAIL_SIZE, playedIds),
    [evergreenPool, playedIds, reloadKey]
  );

  const otherResult = useMemo(
    () => pickUnplayedRandom(otherPool, RAIL_SIZE, playedIds),
    [otherPool, playedIds, reloadKey]
  );

  const jazzResult = useMemo(
    () => pickUnplayedRandom(jazzPool, RAIL_SIZE, playedIds),
    [jazzPool, playedIds, reloadKey]
  );

  // ───────────────────────────────────────────────────
  // SCOPED RESET CALLBACKS
  // ───────────────────────────────────────────────────

  const resetMadeForYou = useCallback(() => {
    resetPlayedSubset(newReleasesPool.map((song) => song._id));
  }, [newReleasesPool, resetPlayedSubset]);

  const resetMelody = useCallback(() => {
    resetPlayedSubset(melodyPool.map((song) => song._id));
  }, [melodyPool, resetPlayedSubset]);

  const resetMelodyRomantic = useCallback(() => {
    resetPlayedSubset(melodyRomanticPool.map((song) => song._id));
  }, [melodyRomanticPool, resetPlayedSubset]);

  const resetDance = useCallback(() => {
    resetPlayedSubset(dancePool.map((song) => song._id));
  }, [dancePool, resetPlayedSubset]);

  const resetPopBased = useCallback(() => {
    resetPlayedSubset(popBasedPool.map((song) => song._id));
  }, [popBasedPool, resetPlayedSubset]);

  const resetDevotional = useCallback(() => {
    resetPlayedSubset(devotionalPool.map((song) => song._id));
  }, [devotionalPool, resetPlayedSubset]);

  const resetEvergreen = useCallback(() => {
    resetPlayedSubset(evergreenPool.map((song) => song._id));
  }, [evergreenPool, resetPlayedSubset]);

  const resetOther = useCallback(() => {
    resetPlayedSubset(otherPool.map((song) => song._id));
  }, [otherPool, resetPlayedSubset]);

  const resetJazz = useCallback(() => {
    resetPlayedSubset(jazzPool.map((song) => song._id));
  }, [jazzPool, resetPlayedSubset]);

  // ───────────────────────────────────────────────────
  // PER-SECTION AUTO-RESET — 90% PLAYED → 12 DAYS → RESET
  //
  // Each genre section arms its own 12-day timer the
  // first time its pool crosses 90% played. The timer:
  //   • does NOT restart on subsequent plays
  //   • is cancelled if the pool drops back below 90%
  //   • re-checks at fire time (overlapping pools can
  //     un-play shared songs before it fires)
  //
  // IMPORTANT: the "armed at" timestamp is persisted to
  // localStorage, so the 12 days continue to elapse even
  // when this page is unmounted (navigation, refresh,
  // tab close). On every mount / playedIds change we
  // check whether any armed section has expired.
  // ───────────────────────────────────────────────────

  // Refs so the expiry check (which runs in a useEffect
  // with a stable dependency list) always sees the latest
  // pools + played set without re-arming on every play.
  const poolsRef = useRef({});
  const playedIdsRef = useRef(playedIds);
  const resetFnsRef = useRef({});

  useEffect(() => {
    playedIdsRef.current = playedIds;
  }, [playedIds]);

  useEffect(() => {
    poolsRef.current = {
      melody: melodyPool,
      "melody-romantic": melodyRomanticPool,
      dance: dancePool,
      pop: popBasedPool,
      devotional: devotionalPool,
      evergreen: evergreenPool,
      other: otherPool,
      jazz: jazzPool,
    };

    resetFnsRef.current = {
      melody: resetMelody,
      "melody-romantic": resetMelodyRomantic,
      dance: resetDance,
      pop: resetPopBased,
      devotional: resetDevotional,
      evergreen: resetEvergreen,
      other: resetOther,
      jazz: resetJazz,
    };
  }, [
    melodyPool,
    melodyRomanticPool,
    dancePool,
    popBasedPool,
    devotionalPool,
    evergreenPool,
    otherPool,
    jazzPool,
    resetMelody,
    resetMelodyRomantic,
    resetDance,
    resetPopBased,
    resetDevotional,
    resetEvergreen,
    resetOther,
    resetJazz,
  ]);

  // ─── localStorage helpers ───

  const readArmedAt = (key) => {
    try {
      const raw = localStorage.getItem(
        AUTO_RESET_STORAGE_PREFIX + key
      );
      if (!raw) return null;
      const ts = Number(raw);
      return Number.isFinite(ts) ? ts : null;
    } catch {
      return null;
    }
  };

  const writeArmedAt = (key, ts) => {
    try {
      localStorage.setItem(
        AUTO_RESET_STORAGE_PREFIX + key,
        String(ts)
      );
    } catch {
      // localStorage may be unavailable (privacy mode) — ignore
    }
  };

  const clearArmedAt = (key) => {
    try {
      localStorage.removeItem(AUTO_RESET_STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
  };

  // Compute how many songs in `pool` are in `playedIds`.
  const countPlayed = (pool, playedSet) => {
    let n = 0;
    for (const song of pool) {
      if (playedSet.has(song._id)) n++;
    }
    return n;
  };

  // ─── Main auto-reset effect ───
  //
  // Runs on every change to pools / playedIds. For each
  // section it:
  //   1. Skips pools < AUTO_RESET_MIN_POOL (and clears
  //      any stale armed timestamp).
  //   2. If below the 90% threshold → clears armed timestamp.
  //   3. If above the threshold:
  //        a. If already armed → checks whether the stored
  //           timestamp has expired; if so, fires reset.
  //        b. If not armed → arms now (stores Date.now()).
  //
  // Because we store the timestamp in localStorage, the
  // 12-day clock survives unmount / refresh / tab close.
  // ───────────────────────────────────────────────────

  useEffect(() => {
    if (!songs.length) return;

    const sectionKeys = [
      "melody",
      "melody-romantic",
      "dance",
      "pop",
      "devotional",
      "evergreen",
      "other",
      "jazz",
      // "made-for-you" intentionally excluded — its rolling
      // window + backfill would thrash.
    ];

    const now = Date.now();

    for (const key of sectionKeys) {
      const pool = poolsRef.current[key];
      const resetFn = resetFnsRef.current[key];

      if (!pool || !resetFn) continue;

      // ── 1. Pool too small → clear any stale timestamp ──
      if (pool.length < AUTO_RESET_MIN_POOL) {
        clearArmedAt(key);
        continue;
      }

      const playedInPool = countPlayed(pool, playedIds);
      const threshold = Math.ceil(pool.length * AUTO_RESET_RATIO);
      const above = playedInPool >= threshold;

      // ── 2. Dropped below threshold → disarm ──
      if (!above) {
        clearArmedAt(key);
        continue;
      }

      // ── 3a. Already armed → check expiry ──
      const armedAt = readArmedAt(key);

      if (armedAt !== null) {
        if (now - armedAt >= AUTO_RESET_DELAY_MS) {
          // Re-check against the latest snapshot at fire time
          const latestPool = poolsRef.current[key];
          const latestPlayed = playedIdsRef.current;

          if (
            latestPool &&
            latestPool.length >= AUTO_RESET_MIN_POOL
          ) {
            const latestPlayedCount = countPlayed(
              latestPool,
              latestPlayed
            );
            const latestThreshold = Math.ceil(
              latestPool.length * AUTO_RESET_RATIO
            );

            if (latestPlayedCount >= latestThreshold) {
              resetFn();
            }
          }

          // Whether or not the reset fired, the timer is spent.
          clearArmedAt(key);
        }
        continue;
      }

      // ── 3b. Not armed → arm now ──
      writeArmedAt(key, now);
    }
  }, [
    songs,
    playedIds,
    melodyPool,
    melodyRomanticPool,
    dancePool,
    popBasedPool,
    devotionalPool,
    evergreenPool,
    otherPool,
    jazzPool,
  ]);

  // ───────────────────────────────────────────────────
  // RECENTLY PLAYED (unchanged — global history)
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

  const renderSection = (result, key, titleNode, onReset) => {
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
          <ExhaustedPlaceholder onReset={onReset} />
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
          aria-label="Reset all played songs"
          title="Reset all played songs"
        >
          <i className="fa-solid fa-rotate-left"></i>{" "}
          Reset all
        </button>
      </div>

      {/* Made for you — fully random across unplayed + played */}
      {renderSection(
        madeForYouResult,
        "made-for-you",
        "Made for you",
        resetMadeForYou
      )}

      {/* Melody — tiered */}
      {renderSection(
        melodyResult,
        GENRE_GROUPS.melody.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.melody.icon}`}></i>{" "}
          {GENRE_GROUPS.melody.label}
        </>,
        resetMelody
      )}

      {/* Melody & Romance — tiered */}
      {renderSection(
        melodyRomanticResult,
        GENRE_GROUPS.melodyRomantic.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.melodyRomantic.icon}`}></i>{" "}
          {GENRE_GROUPS.melodyRomantic.label}
        </>,
        resetMelodyRomantic
      )}

      {/* Dance & Electronic — tiered */}
      {renderSection(
        danceResult,
        GENRE_GROUPS.danceElectronic.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.danceElectronic.icon}`}></i>{" "}
          {GENRE_GROUPS.danceElectronic.label}
        </>,
        resetDance
      )}

      {/* Pop Collection — tiered */}
      {renderSection(
        popBasedResult,
        GENRE_GROUPS.popBased.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.popBased.icon}`}></i>{" "}
          {GENRE_GROUPS.popBased.label}
        </>,
        resetPopBased
      )}

      {/* Devotional & Traditional — random (unchanged) */}
      {renderSection(
        devotionalResult,
        GENRE_GROUPS.devotional.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.devotional.icon}`}></i>{" "}
          {GENRE_GROUPS.devotional.label}
        </>,
        resetDevotional
      )}

      {/* Evergreen Classics — tiered */}
      {renderSection(
        evergreenResult,
        GENRE_GROUPS.evergreen.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.evergreen.icon}`}></i>{" "}
          {GENRE_GROUPS.evergreen.label}
        </>,
        resetEvergreen
      )}

      {/* More to Explore — random (unchanged) */}
      {renderSection(
        otherResult,
        GENRE_GROUPS.otherGenres.key,
        <>
          <i className={`fa-solid ${GENRE_GROUPS.otherGenres.icon}`}></i>{" "}
          {GENRE_GROUPS.otherGenres.label}
        </>,
        resetOther
      )}

      {/* Jazz — random (unchanged) */}
      {renderSection(
        jazzResult,
        "jazz",
        "Jazz",
        resetJazz
      )}

      {/* Recently played — unchanged */}
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

      {/* Continue listening — unchanged */}
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