// pages/QueuePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
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
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previousSessions, setPreviousSessions] = useState([]);

  // Load previous queue sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('ragafy_queue_sessions');
    if (savedSessions) {
      setPreviousSessions(JSON.parse(savedSessions));
    }
  }, []);

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

  const handlePlayNow = (index) => {
    if (playQueue(index)) {
      navigate('/player', { 
        state: { 
          songs: queue, 
          startIndex: index,
          fromQueue: true
        }
      });
    }
  };

  const handlePlayAll = () => {
    if (playQueue(0)) {
      navigate('/player', { 
        state: { 
          songs: queue, 
          startIndex: 0,
          fromQueue: true
        }
      });
    }
  };

  const handleShufflePlay = () => {
    shuffleQueue();
    setTimeout(() => {
      navigate('/player', { 
        state: { 
          songs: queue, 
          startIndex: 0,
          fromQueue: true
        }
      });
    }, 100);
  };

  const handleSaveSession = () => {
    saveCurrentSession();
    alert('Queue session saved! You can restore it from history.');
  };

  const handleRestoreSession = (session) => {
    if (window.confirm(`Restore queue with ${session.count} songs? Current queue will be replaced.`)) {
      clearQueue();
      addMultipleToQueue(session.songs);
      setShowHistory(false);
    }
  };

  const handleClearWithSave = () => {
    if (queue.length > 0 && window.confirm('Save current queue before clearing?')) {
      saveCurrentSession();
    }
    clearQueue();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = (queue) => {
    const totalSeconds = queue.reduce((acc, song) => acc + (song.duration || 0), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="queue-page">
      <div className="queue-header">
        <button className="queue-back-btn" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>
        <h1>Queue</h1>
        <div className="queue-header-actions">
          <button 
            className={`queue-history-toggle ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            {showHistory ? 'Show Queue' : 'History'}
          </button>
        </div>
      </div>

      {showHistory ? (
        // Previous Sessions View
        <div className="queue-history">
          <h2>Previous Queue Sessions</h2>
          {previousSessions.length === 0 ? (
            <div className="queue-history-empty">
              <i className="fa-solid fa-clock"></i>
              <p>No previous queue sessions found</p>
              <p className="queue-history-hint">Save your queue to access it later</p>
            </div>
          ) : (
            <div className="queue-history-list">
              {previousSessions.map(session => (
                <div key={session.id} className="queue-history-item">
                  <div className="queue-history-info">
                    <span className="queue-history-date">
                      {new Date(session.timestamp).toLocaleDateString()} at{' '}
                      {new Date(session.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="queue-history-count">
                      {session.count} songs
                    </span>
                  </div>
                  <div className="queue-history-preview">
                    {session.songs.slice(0, 3).map(song => (
                      <span key={song._id} className="queue-history-song">
                        {song.title}
                      </span>
                    ))}
                    {session.count > 3 && (
                      <span className="queue-history-more">
                        +{session.count - 3} more
                      </span>
                    )}
                  </div>
                  <button 
                    className="queue-history-restore"
                    onClick={() => handleRestoreSession(session)}
                  >
                    <i className="fa-solid fa-rotate-left"></i> Restore
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="queue-back-to-queue" onClick={() => setShowHistory(false)}>
            <i className="fa-solid fa-arrow-left"></i> Back to Queue
          </button>
        </div>
      ) : (
        // Current Queue View
        <>
          {queue.length === 0 ? (
            <div className="queue-empty">
              <i className="fa-solid fa-music"></i>
              <h2>Your queue is empty</h2>
              <p>Add songs from browse, search, or playlists</p>
              
              {previousSessions.length > 0 && (
                <div className="queue-restore-option">
                  <p>Or restore a previous session:</p>
                  <button 
                    className="queue-restore-btn"
                    onClick={() => setShowHistory(true)}
                  >
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    View Previous Queues
                  </button>
                </div>
              )}
              
              <button className="queue-browse-btn" onClick={() => navigate('/browse')}>
                Browse Songs
              </button>
            </div>
          ) : (
            <>
              <div className="queue-stats">
                <span>{queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue</span>
                <span className="stats-separator">•</span>
                <span>Total: {calculateTotalDuration(queue)}</span>
                {currentQueueSong && (
                  <>
                    <span className="stats-separator">•</span>
                    <span className="queue-current-indicator">
                      Now: {currentQueueSong.title}
                    </span>
                  </>
                )}
              </div>

              <div className="queue-actions">
                <button className="queue-action-btn play-all" onClick={handlePlayAll}>
                  <i className="fa-solid fa-play"></i> Play All
                </button>
                <button className="queue-action-btn shuffle" onClick={handleShufflePlay}>
                  <i className="fa-solid fa-shuffle"></i> Shuffle
                </button>
                <button className="queue-action-btn save" onClick={handleSaveSession}>
                  <i className="fa-regular fa-bookmark"></i> Save
                </button>
                <button className="queue-action-btn clear" onClick={handleClearWithSave}>
                  <i className="fa-regular fa-trash-can"></i> Clear
                </button>
              </div>

              <div className="queue-list">
                <div className="queue-list-header">
                  <span>#</span>
                  <span>Title</span>
                  <span>Actions</span>
                </div>

                {queue.map((song, index) => (
                  <div
                    key={`${song._id}-${index}`}
                    className={`queue-item ${
                      index === currentQueueIndex ? "queue-item-current" : ""
                    }`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handlePlayNow(index)}
                  >
                    {/* INDEX */}
                    <span className="queue-item-index">
                      {index === currentQueueIndex ? (
                        <i className="fa-solid fa-play playing-indicator"></i>
                      ) : (
                        index + 1
                      )}
                    </span>

                    {/* SONG INFO */}
                    <div className="queue-item-info">
                      {photos[song._id] ? (
                        <img
                          src={photos[song._id]}
                          alt={song.title}
                          className="queue-item-image"
                        />
                      ) : (
                        <div className="queue-item-image-placeholder">
                          <i className="fa-solid fa-music"></i>
                        </div>
                      )}

                      <div>
                        <div className="queue-item-title">{song.title}</div>

              
                      </div>
                    </div>

                      {/* ACTIONS */}
                      <div
                        className="queue-item-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="queue-item-btn play-now"
                          onClick={() => handlePlayNow(index)}
                        >
                          <i className="fa-solid fa-play"></i>
                        </button>

                        <button
                          className="queue-item-btn remove"
                          onClick={() => removeFromQueue(song._id)}
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>

                        <span className="queue-drag-handle">
                          <i className="fa-solid fa-grip-lines"></i>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              {queueHistory.length > 0 && (
                <div className="queue-history-section">
                  <h3>Recently Played</h3>
                  <div className="queue-history-mini">
                    {queueHistory.slice(-3).reverse().map((song, idx) => (
                      <div key={idx} className="queue-history-mini-item">
                        {photos[song._id] && (
                          <img src={photos[song._id]} alt={song.title} />
                        )}
                        <span>{song.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default QueuePage;