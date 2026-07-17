// services/songService/buildRadio.js

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build a "radio" queue seeded from one song. Songs sharing genre, artist,
 * singer, or language score higher and surface earlier in the queue.
 */
export function buildRadioQueue(seedSong, allSongs, size = 30) {
  if (!seedSong || !allSongs?.length) return [];

  const seedSingerIds = (seedSong.singers || []).map((s) => s._id);

  const scored = allSongs
    .filter((s) => s._id !== seedSong._id)
    .map((s) => {
      let score = 0;
      if (s.genre?._id && s.genre._id === seedSong.genre?._id) score += 3;
      if (s.artist?._id && s.artist._id === seedSong.artist?._id) score += 3;
      if (s.language?._id && s.language._id === seedSong.language?._id) score += 1;
      const sharesSinger = (s.singers || []).some((x) => seedSingerIds.includes(x._id));
      if (sharesSinger) score += 2;
      return { song: s, score };
    })
    .filter((entry) => entry.score > 0);

  const byScore = {};
  scored.forEach(({ song, score }) => {
    byScore[score] = byScore[score] || [];
    byScore[score].push(song);
  });

  const ordered = Object.keys(byScore)
    .map(Number)
    .sort((a, b) => b - a)
    .flatMap((score) => shuffle(byScore[score]));

  let queue = [seedSong, ...ordered];

  // Not enough matches? top up with random catalog songs so radio never feels thin
  if (queue.length < size) {
    const remaining = shuffle(
      allSongs.filter((s) => !queue.some((q) => q._id === s._id))
    );
    queue = [...queue, ...remaining];
  }

  return queue.slice(0, size);
}