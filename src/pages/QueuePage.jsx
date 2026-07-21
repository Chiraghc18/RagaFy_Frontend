import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useGlobalPlayer } from '../context/GlobalPlayerContext';
import '../assets/style/QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const {
    queue,
    photos,
    currentQueueSong,
    currentQueueIndex,
    removeFromQueue,
    clearQueue,
    playQueue,
    shuffleQueue,
    moveSongInQueue,
    addMultipleToQueue,
    queueHistory
  } = useData();
  
  const { currentSong, isPlaying } = useGlobalPlayer();

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load previous queue sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('ragafy_queue_sessions');
    if (savedSessions) {
      setPreviousSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Filter queue by search term
  const filteredQueue = searchTerm 
    ? queue.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.artist?.name || song.singers?.[0]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : queue;

  // Save current queue as a session
  const saveCurrentSession = () => {
    if (queue.length === 0) return;
    const session = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      songs: queue.map(song => ({
        _id: song._id,
        title: song.title,
        artist: song.artist?.name || song.singers?.[0]?.name,
        thumbnail: photos[song._id]
      })),
      count: queue.length
    };
    const updatedSessions = [session, ...previousSessions].slice(0, 10);
    setPreviousSessions(updatedSessions);
    localStorage.setItem('ragafy_queue_sessions', JSON.stringify(updatedSessions));
  };

  // Drag and Drop handlers
  const handleDragStart = (index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      moveSongInQueue(draggedItem, dragOverItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Play handlers
  const handlePlayNow = (index) => {
    if (playQueue(index)) {
      navigate('/player', {
        state: { songs: queue, startIndex: index, fromQueue: true }
      });
    }
  };

  const handlePlayAll = () => {
    if (playQueue(0)) {
      navigate('/player', {
        state: { songs: queue, startIndex: 0, fromQueue: true }
      });
    }
  };

  const handleShufflePlay = () => {
    shuffleQueue();
    navigate('/player', {
      state: { startIndex: 0, fromQueue: true, shuffled: true }
    });
  };

  // Session handlers
  const handleSaveSession = () => {
    saveCurrentSession();
    // Show toast notification instead of alert
    showToast('Queue session saved! ✓', 'success');
  };

  const handleRestoreSession = (session) => {
    if (queue.length > 0 && !window.confirm(`Restore queue with ${session.count} songs? Current queue will be replaced.`)) return;
    clearQueue();
    addMultipleToQueue(session.songs);
    setShowHistory(false);
    showToast('Queue restored successfully! ✓', 'success');
  };

  const handleClearWithSave = () => {
    if (queue.length === 0) return;
    if (window.confirm('Save current queue before clearing?')) {
      saveCurrentSession();
    }
    clearQueue();
    setSelectedSongs(new Set());
    setSelectMode(false);
  };

  // Selection handlers
  const toggleSongSelection = (songId) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
    if (newSelected.size === 0) setSelectMode(false);
  };

  const selectAll = () => {
    const allIds = new Set(filteredQueue.map(s => s._id));
    setSelectedSongs(allIds);
  };

  const deselectAll = () => {
    setSelectedSongs(new Set());
    setSelectMode(false);
  };

  const handleRemoveSelected = () => {
    if (selectedSongs.size === 0) return;
    if (window.confirm(`Remove ${selectedSongs.size} song(s) from queue?`)) {
      selectedSongs.forEach(songId => removeFromQueue(songId));
      setSelectedSongs(new Set());
      setSelectMode(false);
      showToast(`${selectedSongs.size} song(s) removed`, 'info');
    }
  };

  // Toast notification
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `qp__toast qp__toast--${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('qp__toast--out');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  // Utility
  const calculateTotalDuration = (songs) => {
    const totalSeconds = songs.reduce((acc, song) => acc + (song.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Back Button */}
      <div className="qp__back" onClick={() => navigate(-1)}>
        <div className="qp__back-icon">
          <i className="fa-solid fa-arrow-left"></i>
        </div>
        <span className="qp__back-text">Back</span>
      </div>

      <div className="qp">
        {/* Header */}
        <div className="qp__header">
          <div className="qp__header-left">
            <h1 className="qp__title">Queue</h1>
            {queue.length > 0 && (
              <span className="qp__badge">{queue.length}</span>
            )}
          </div>
          <div className="qp__header-right">
            {queue.length > 0 && (
              <button 
                className={`qp__select-toggle ${selectMode ? 'qp__select-toggle--active' : ''}`}
                onClick={() => { setSelectMode(!selectMode); deselectAll(); }}
              >
                <i className="fa-solid fa-check-double"></i>
                {selectMode ? 'Done' : 'Select'}
              </button>
            )}
            <button
              className={`qp__history-toggle ${showHistory ? 'qp__history-toggle--active' : ''}`}
              onClick={() => setShowHistory(!showHistory)}
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
              {showHistory ? 'Queue' : 'History'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {queue.length > 0 && !showHistory && !selectMode && (
          <div className="qp__search">
            <i className="fa-solid fa-magnifying-glass qp__search-icon"></i>
            <input
              type="text"
              placeholder="Search in queue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="qp__search-input"
            />
            {searchTerm && (
              <i className="fa-solid fa-xmark qp__search-clear" onClick={() => setSearchTerm('')}></i>
            )}
          </div>
        )}

        {showHistory ? (
          /* HISTORY VIEW */
          <div className="qp__history">
            <h2 className="qp__history-title">Saved Queue Sessions</h2>
            {previousSessions.length === 0 ? (
              <div className="qp__empty">
                <div className="qp__empty-art">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <p className="qp__empty-title">No saved sessions</p>
                <p className="qp__empty-text">Save your queue to access it later</p>
              </div>
            ) : (
              <div className="qp__history-list">
                {previousSessions.map(session => (
                  <div key={session.id} className="qp__history-item">
                    <div className="qp__history-info">
                      <span className="qp__history-date">
                        <i className="fa-regular fa-calendar"></i>
                        {new Date(session.timestamp).toLocaleDateString()}
                      </span>
                      <span className="qp__history-time">
                        {new Date(session.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="qp__history-count">{session.count} songs</span>
                    </div>
                    <div className="qp__history-songs">
                      {session.songs.slice(0, 4).map(song => (
                        <span key={song._id} className="qp__history-song">{song.title}</span>
                      ))}
                      {session.count > 4 && (
                        <span className="qp__history-more">+{session.count - 4} more</span>
                      )}
                    </div>
                    <button className="qp__history-restore" onClick={() => handleRestoreSession(session)}>
                      <i className="fa-solid fa-rotate-left"></i> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : queue.length === 0 ? (
          /* EMPTY STATE */
          <div className="qp__empty">
            <div className="qp__empty-art">
              <i className="fa-solid fa-headphones"></i>
            </div>
            <h2 className="qp__empty-title">Your queue is empty</h2>
            <p className="qp__empty-text">Add songs from browse, search, or playlists</p>
            <div className="qp__empty-actions">
              <button className="qp__btn qp__btn--primary" onClick={() => navigate('/browse')}>
                <i className="fa-solid fa-compass"></i> Browse Songs
              </button>
              <button className="qp__btn qp__btn--secondary" onClick={() => navigate('/search-filter')}>
                <i className="fa-solid fa-filter"></i> Search & Filter
              </button>
            </div>
            {previousSessions.length > 0 && (
              <button className="qp__btn qp__btn--outline" onClick={() => setShowHistory(true)}>
                <i className="fa-solid fa-clock-rotate-left"></i> Restore Previous Queue
              </button>
            )}
          </div>
        ) : (
          /* QUEUE VIEW */
          <>
            {/* Stats Bar */}
            <div className="qp__stats">
              <div className="qp__stat">
                <i className="fa-solid fa-music"></i>
                <span>{queue.length} {queue.length === 1 ? 'song' : 'songs'}</span>
              </div>
              <div className="qp__stat">
                <i className="fa-solid fa-clock"></i>
                <span>{calculateTotalDuration(queue)}</span>
              </div>
              {currentQueueSong && (
                <div className="qp__now-playing">
                  <div className="qp__now-playing-dot"></div>
                  <span title={currentQueueSong.title}>{currentQueueSong.title}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectMode ? (
              <div className="qp__select-actions">
                <button className="qp__action-btn qp__action-btn--select-all" onClick={selectAll}>
                  <i className="fa-solid fa-check-double"></i> Select All ({filteredQueue.length})
                </button>
                <button className="qp__action-btn qp__action-btn--remove" onClick={handleRemoveSelected} disabled={selectedSongs.size === 0}>
                  <i className="fa-solid fa-trash-can"></i> Remove ({selectedSongs.size})
                </button>
                <button className="qp__action-btn qp__action-btn--cancel" onClick={deselectAll}>
                  <i className="fa-solid fa-xmark"></i> Cancel
                </button>
              </div>
            ) : (
              <div className="qp__actions">
                <button className="qp__action qp__action--play" onClick={handlePlayAll}>
                  <i className="fa-solid fa-play"></i> Play All
                </button>
                <button className="qp__action qp__action--shuffle" onClick={handleShufflePlay}>
                  <i className="fa-solid fa-shuffle"></i> Shuffle
                </button>
                <button className="qp__action qp__action--save" onClick={handleSaveSession}>
                  <i className="fa-regular fa-bookmark"></i> Save
                </button>
                <button className="qp__action qp__action--clear" onClick={handleClearWithSave}>
                  <i className="fa-regular fa-trash-can"></i> Clear
                </button>
              </div>
            )}

            {/* Search Results Info */}
            {searchTerm && !selectMode && (
              <div className="qp__search-info">
                Showing {filteredQueue.length} of {queue.length} songs
              </div>
            )}

            {/* Queue List */}
            <div className="qp__list">
              {filteredQueue.length === 0 && searchTerm ? (
                <div className="qp__list-empty">
                  <i className="fa-solid fa-search"></i>
                  <p>No songs match "{searchTerm}"</p>
                </div>
              ) : (
                filteredQueue.map((song, displayIndex) => {
                  const actualIndex = queue.findIndex(s => s._id === song._id);
                  const isCurrentSong = currentQueueIndex === actualIndex;
                  const isSelected = selectedSongs.has(song._id);

                  return (
                    <div
                      key={`${song._id}-${actualIndex}`}
                      className={`qp__item ${isCurrentSong ? 'qp__item--current' : ''} ${isSelected ? 'qp__item--selected' : ''} ${draggedItem === actualIndex ? 'qp__item--dragging' : ''} ${dragOverItem === actualIndex ? 'qp__item--drag-over' : ''}`}
                      draggable={!selectMode}
                      onDragStart={() => !selectMode && handleDragStart(actualIndex)}
                      onDragOver={(e) => !selectMode && handleDragOver(e, actualIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={() => selectMode ? toggleSongSelection(song._id) : handlePlayNow(actualIndex)}
                    >
                      {/* Checkbox for select mode */}
                      {selectMode && (
                        <div className="qp__item-checkbox" onClick={(e) => { e.stopPropagation(); toggleSongSelection(song._id); }}>
                          <i className={`fa-solid ${isSelected ? 'fa-check-circle' : 'fa-circle'}`}></i>
                        </div>
                      )}

                      {/* Index or Playing Indicator */}
                      {!selectMode && (
                        <span className="qp__item-index">
                          {isCurrentSong ? (
                            isPlaying ? (
                              <div className="qp__playing-bars">
                                <span></span><span></span><span></span>
                              </div>
                            ) : (
                              <i className="fa-solid fa-pause qp__playing-pause"></i>
                            )
                          ) : (
                            actualIndex + 1
                          )}
                        </span>
                      )}

                      {/* Song Image */}
                      {photos[song._id] ? (
                        <img src={photos[song._id]} alt={song.title} className="qp__item-img" />
                      ) : (
                        <div className="qp__item-placeholder">
                          <i className="fa-solid fa-music"></i>
                        </div>
                      )}

                      {/* Song Details */}
                      <div className="qp__item-details">
                        <span className="qp__item-title">{song.title}</span>
                        <span className="qp__item-artist">
                          {song.artist?.name || song.singers?.[0]?.name || 'Unknown Artist'}
                        </span>
                      </div>

                      {/* Duration */}
                      <span className="qp__item-duration">
                        {formatDuration(song.duration)}
                      </span>

                      {/* Actions */}
                      {!selectMode && (
                        <div className="qp__item-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="qp__item-btn qp__item-btn--play" title="Play now" onClick={() => handlePlayNow(actualIndex)}>
                            <i className="fa-solid fa-play"></i>
                          </button>
                          <button className="qp__item-btn qp__item-btn--remove" title="Remove" onClick={() => removeFromQueue(song._id)}>
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                          <span className="qp__item-drag" title="Drag to reorder">
                            <i className="fa-solid fa-grip-lines"></i>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Recently Played History */}
            {queueHistory.length > 0 && !selectMode && (
              <div className="qp__recent">
                <h3 className="qp__recent-title">
                  <i className="fa-solid fa-clock-rotate-left"></i> Recently Played
                </h3>
                <div className="qp__recent-list">
                  {queueHistory.slice(-5).reverse().map((song, idx) => (
                    <div key={idx} className="qp__recent-item">
                      {photos[song._id] && <img src={photos[song._id]} alt={song.title} />}
                      <span>{song.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default QueuePage;