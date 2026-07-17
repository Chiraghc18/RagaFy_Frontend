// components/UserComponents/AllSong.jsx
import React, { useMemo } from "react";
import { useData } from "../../context/DataContext";
import { useGlobalPlayer } from "../../context/GlobalPlayerContext";
import { buildRadioQueue } from "../../services/songService/buildRadio";
import "../../assets/style/UserPage/AllSongs.css";
import { useNavigate, Link } from "react-router-dom";

// Rails pulled from filterOptions
const CATEGORY_RAILS = [
  { key: "genre", dataKey: "genres", label: "Genres", icon: "fa-music" },
  { key: "language", dataKey: "languages", label: "Languages", icon: "fa-language" },
  { key: "movie", dataKey: "movies", label: "Movies", icon: "fa-clapperboard" },
  { key: "singer", dataKey: "singers", label: "Singers", icon: "fa-microphone" },
  { key: "artist", dataKey: "artists", label: "Artists", icon: "fa-user-music" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// Fisher-Yates shuffle, used only to pick "Made for you"
function pickRandom(arr, n) {
  if (!arr || arr.length === 0) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default function AllSongs() {
  // NOTE: fixed — was destructured as `err`, but DataContext exposes `error`
  const { songs, photos, playlists, filterOptions, queue, loading, error } = useData();
  const { recentlyPlayedIds, playPlaylist } = useGlobalPlayer();
  const navigate = useNavigate();

  const madeForYou = useMemo(() => pickRandom(songs, 12), [songs.length]);

  // Resolve stored recently-played IDs against the live song list,
  // preserving the most-recent-first order they were stored in
  const recentlyPlayed = useMemo(() => {
    return recentlyPlayedIds
      .map((id) => songs.find((s) => s._id === id))
      .filter(Boolean);
  }, [recentlyPlayedIds, songs]);

  const handleSongClick = (song) => {
    const filteredSameCategory = songs.filter(
      (s) =>
        s.genre?._id === song.genre?._id &&
        s.language?._id === song.language?._id
    );
    const startIndex = filteredSameCategory.findIndex((s) => s._id === song._id);
    navigate("/player", { state: { songs: filteredSameCategory, startIndex } });
  };

  const goToPlayer = (songList, startIndex) => {
    navigate("/player", { state: { songs: songList, startIndex } });
  };

  const goToCategory = (categoryKey, item) => {
    navigate("/browse", { state: { category: categoryKey, item } });
  };

  // Build a scored "radio" queue seeded from the clicked song and start
  // playing it immediately via the global player
  const handleStartRadio = (seedSong, e) => {
    e.stopPropagation(); // don't also trigger the card's onClick / navigation
    const radioQueue = buildRadioQueue(seedSong, songs);
    if (radioQueue.length) playPlaylist(radioQueue, 0);
  };

  if (loading)
    return (
      <div className="all-songs-page">
        <div className="all-songs__loading">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="all-songs__skeleton-card">
              <div className="all-songs__skeleton-content">
                <div className="all-songs__skeleton-image"></div>
                <div className="all-songs__skeleton-text">
                  <div className="all-songs__skeleton-line"></div>
                  <div className="all-songs__skeleton-line all-songs__skeleton-line--short"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="all-songs-page">
        <div className="all-songs__error">
          <div className="all-songs__error-icon">⚠️</div>
          <h3 className="all-songs__error-title">Something went wrong</h3>
          <p className="all-songs__error-message">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="all-songs-page">
      {/* Greeting */}
      <div className="all-songs__greeting">
        <p className="all-songs__eyebrow">{greeting()}</p>
      </div>

      {/* Continue listening (from queue) */}
      {queue && queue.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Continue listening</h2>
          <div className="all-songs__rail">
            {queue.slice(0, 8).map((song, idx) => (
              <div
                key={song._id + idx}
                className="all-songs__rail-card"
                onClick={() => goToPlayer(queue, idx)}
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
            ))}
          </div>
        </div>
      )}

      {/* Recently played */}
      {recentlyPlayed.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Recently played</h2>
          <div className="all-songs__rail">
            {recentlyPlayed.map((song, idx) => (
              <div
                key={song._id}
                className="all-songs__rail-card"
                onClick={() => goToPlayer(recentlyPlayed, idx)}
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
            ))}
          </div>
        </div>
      )}

      {/* Made for you */}
      {madeForYou.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Made for you</h2>
          <div className="all-songs__rail">
            {madeForYou.map((song, idx) => (
              <div
                key={song._id}
                className="all-songs__rail-card"
                onClick={() => goToPlayer(madeForYou, idx)}
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
            ))}
          </div>
        </div>
      )}

      {/* Playlists — kept your original section/markup */}
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

      {/* Category rails */}
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
            <div className="all-songs__rail all-songs__rail--pills">
              {items.slice(0, 12).map((item) => (
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
              ))}
            </div>
          </div>
        );
      })}

      {/* Songs Section — your original full grid, unchanged, + radio button */}
      <div className="all-songs__songs">
        <h2 className="all-songs__section-title">All Songs</h2>
        <div className="all-songs__grid">
          {songs.length > 0 ? (
            songs.map((song) => (
              <div
                key={song._id}
                className="all-songs__card"
                onClick={() => handleSongClick(song)}
              >
                <div className="all-songs__card-content">
                  {photos[song._id] ? (
                    <img
                      src={photos[song._id]}
                      alt={song.title}
                      className="all-songs__image"
                    />
                  ) : (
                    <div className="all-songs__image all-songs__image--placeholder">
                      🎵
                    </div>
                  )}
                  <div className="all-songs__info">
                    <div className="all-songs__title">{song.title}</div>
                    <div className="all-songs__meta">
                      {song.artist?.name ||
                        song.singers?.map((s) => s.name).join(", ") ||
                        "Unknown Artist"}
                    </div>
                  </div>
                  <div className="all-songs__play-icon">▶</div>
                </div>

                {/* Radio button — starts a scored queue seeded from this song */}
                <div className="all-songs__card-actions">
                  <button
                    className="all-songs__add-to-queue all-songs__start-radio"
                    onClick={(e) => handleStartRadio(song, e)}
                    title="Start radio from this song"
                  >
                    <i className="fa-solid fa-tower-broadcast"></i>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="all-songs__empty">
              <div className="all-songs__empty-icon">🎵</div>
              <p className="all-songs__empty-text">No songs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
