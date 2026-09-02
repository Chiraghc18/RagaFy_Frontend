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

// Genre groupings for custom sections
const GENRE_GROUPS = {
  // Section 1: Melody + Romantic + Romantic Pop
  melodyRomantic: {
    key: "melody-romantic",
    label: "Melody & Romance",
    icon: "fa-heart",
    genres: ["melody", "romantic", "romantic pop"]
  },
  // Section 2: Pop-based (excluding romantic pop, electronic dance pop, folk pop fusion)
  popBased: {
    key: "pop-based",
    label: "Pop Collection",
    icon: "fa-music",
    genres: ["pop", "pop rock", "pop energetic", "pop emotional", "pop melodies", "hip-hop"],
    excludeGenres: ["romantic pop", "electronic dance-pop", "folk-pop fusion"]
  },
  // Section 3: Everything else (excluding jazz, yakshagana, devotional, epic folk-devotional)
  otherGenres: {
    key: "other-genres",
    label: "More to Explore",
    icon: "fa-compass",
    excludeGenres: ["jazz", "yakshagana", "devotional", "epic folk-devotional", "melody", "romantic", "romantic pop", "pop", "pop rock", "pop energetic", "pop emotional", "pop melodies", "evergreen kannada songs", "hip-hop",]
  }
};

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

// Helper function to get genre name from a song
function getSongGenre(song) {
  if (song.genre?.name) {
    return song.genre.name.toLowerCase();
  }
  
  if (Array.isArray(song.genres)) {
    return song.genres.map(g => g?.name?.toLowerCase()).filter(Boolean);
  }
  
  if (typeof song.genre === "string") {
    return song.genre.toLowerCase();
  }
  
  return "";
}

// Helper function to check if song matches any genre in a list
function songMatchesGenres(song, genreList) {
  const songGenre = getSongGenre(song);
  
  if (Array.isArray(songGenre)) {
    return songGenre.some(g => genreList.includes(g));
  }
  
  return genreList.includes(songGenre);
}

// Helper function to check if song should be excluded
function songMatchesExcludedGenres(song, excludeGenres) {
  const songGenre = getSongGenre(song);
  
  if (Array.isArray(songGenre)) {
    return songGenre.some(g => excludeGenres.includes(g));
  }
  
  return excludeGenres.includes(songGenre);
}

// Reusable Rail component with scroll functionality
function Rail({ items, photos, onItemClick, renderItem }) {
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
    // Add resize listener to recheck scroll
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scrollRail = (direction) => {
    if (railRef.current) {
      const scrollAmount = railRef.current.clientWidth * 0.8; // Scroll 80% of visible width
      const newScrollPosition = railRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      railRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
      
      // Update button visibility after scroll
      setTimeout(checkScroll, 100);
    }
  };

  return (
    <div className="all-songs__rail-wrapper">
      {canScrollLeft && (
        <button 
          className="all-songs__scroll-btn all-songs__scroll-btn--left"
          onClick={() => scrollRail('left')}
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
        {items.map((item, idx) => renderItem(item, idx))}
      </div>
      
      {canScrollRight && (
        <button 
          className="all-songs__scroll-btn all-songs__scroll-btn--right"
          onClick={() => scrollRail('right')}
          aria-label="Scroll right"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      )}
    </div>
  );
}

export default function HomeSections() {
  const { songs, photos, playlists, filterOptions, queue } = useData();
  const { recentlyPlayedIds } = useGlobalPlayer();
  const navigate = useNavigate();

  // Made for you - random selection (unchanged)
  const madeForYou = useMemo(() => pickRandom(songs, 12), [songs.length]);

  // Custom genre sections
  const genreSections = useMemo(() => {
    const sections = [];
    
    // Section 1: Melody + Romantic + Romantic Pop
    const melodyRomanticSongs = songs.filter(song => 
      songMatchesGenres(song, GENRE_GROUPS.melodyRomantic.genres)
    );
    if (melodyRomanticSongs.length > 0) {
      sections.push({
        ...GENRE_GROUPS.melodyRomantic,
        songs: pickRandom(melodyRomanticSongs, 12)
      });
    }
    
    // Section 2: Pop-based (excluding certain pop genres)
    const popBasedSongs = songs.filter(song => {
      const matchesPopGenres = songMatchesGenres(song, GENRE_GROUPS.popBased.genres);
      const matchesExcluded = songMatchesExcludedGenres(song, GENRE_GROUPS.popBased.excludeGenres);
      return matchesPopGenres && !matchesExcluded;
    });
    if (popBasedSongs.length > 0) {
      sections.push({
        ...GENRE_GROUPS.popBased,
        songs: pickRandom(popBasedSongs, 12)
      });
    }
    
    // Section 3: Everything else (excluding jazz, yakshagana, devotional, epic folk-devotional and already included genres)
    const otherGenresSongs = songs.filter(song => {
      const matchesExcluded = songMatchesExcludedGenres(song, GENRE_GROUPS.otherGenres.excludeGenres);
      const inMelodyRomantic = songMatchesGenres(song, GENRE_GROUPS.melodyRomantic.genres);
      const inPopBased = songMatchesGenres(song, GENRE_GROUPS.popBased.genres) && 
                        !songMatchesExcludedGenres(song, GENRE_GROUPS.popBased.excludeGenres);
      
      return !matchesExcluded && !inMelodyRomantic && !inPopBased;
    });
    if (otherGenresSongs.length > 0) {
      sections.push({
        ...GENRE_GROUPS.otherGenres,
        songs: pickRandom(otherGenresSongs, 12)
      });
    }
    
    return sections;
  }, [songs]);

  // Resolve stored recently-played IDs against the live song list
  const recentlyPlayed = useMemo(() => {
    return recentlyPlayedIds
      .map((id) => songs.find((s) => s._id === id))
      .filter(Boolean);
  }, [recentlyPlayedIds, songs]);

  const goToPlayer = (songList, startIndex) => {
    navigate("/player", { state: { songs: songList, startIndex } });
  };

  const goToCategory = (categoryKey, item) => {
    navigate("/browse", { state: { category: categoryKey, item } });
  };

  // Jazz songs
  const jazzSongs = useMemo(() => {
    return songs.filter((song) => {
      // Handles different possible genre structures
      if (song.genre?.name) {
        return song.genre.name.toLowerCase() === "jazz";
      }

      if (Array.isArray(song.genres)) {
        return song.genres.some(
          (genre) => genre?.name?.toLowerCase() === "jazz"
        );
      }

      if (typeof song.genre === "string") {
        return song.genre.toLowerCase() === "jazz";
      }

      return false;
    });
  }, [songs]);

  // Reusable song card renderer
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

  return (
    <div className="home-sections">
      {/* Greeting */}
      <div className="all-songs__greeting">
        <p className="all-songs__eyebrow">{greeting()}</p>
      </div>

      {/* Made for you - General mix */}
      {madeForYou.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Made for you</h2>
          <Rail
            items={madeForYou}
            photos={photos}
            renderItem={(song, idx) => renderSongCard(song, idx, madeForYou)}
          />
        </div>
      )}

      {/* Custom Genre Sections */}
      {genreSections.map((section) => (
        <div className="all-songs__rail-section" key={section.key}>
          <h2 className="all-songs__section-title">
            <i className={`fa-solid ${section.icon}`}></i> {section.label}
          </h2>
          <Rail
            items={section.songs}
            photos={photos}
            renderItem={(song, idx) => renderSongCard(song, idx, section.songs)}
          />
        </div>
      ))}

      {/* Jazz Songs */}
      {jazzSongs.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Jazz</h2>
          <Rail
            items={jazzSongs.slice(0, 12)}
            photos={photos}
            renderItem={(song, idx) => renderSongCard(song, idx, jazzSongs)}
          />
        </div>
      )}

      {/* Recently played */}
      {recentlyPlayed.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Recently played</h2>
          <Rail
            items={recentlyPlayed}
            photos={photos}
            renderItem={(song, idx) => renderSongCard(song, idx, recentlyPlayed)}
          />
        </div>
      )}

      {/* Continue listening (from queue) */}
      {queue && queue.length > 0 && (
        <div className="all-songs__rail-section">
          <h2 className="all-songs__section-title">Continue listening</h2>
          <Rail
            items={queue.slice(0, 8)}
            photos={photos}
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
            <Rail
              items={items.slice(0, 12)}
              photos={photos}
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