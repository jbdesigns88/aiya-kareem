'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';

type CatalogTrack = {
  id: string;
  src: string;
  title: string;
  format: string;
};

type HomePageClientProps = {
  catalogTracks: CatalogTrack[];
};

export default function HomePageClient({ catalogTracks }: HomePageClientProps) {
  const [activeTrack, setActiveTrack] = useState<CatalogTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackDurations, setTrackDurations] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerStateClass = isPlaying ? 'playing' : activeTrack ? 'loaded' : 'idle';
  const hasActiveTrack = activeTrack !== null;

  useEffect(() => {
    let isCancelled = false;

    function formatDuration(durationSeconds: number) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.floor(durationSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const audioElements = catalogTracks.map((track) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = track.src;

      const handleLoadedMetadata = () => {
        if (isCancelled || !Number.isFinite(audio.duration)) return;

        setTrackDurations((current) => {
          if (current[track.id]) return current;
          return {
            ...current,
            [track.id]: formatDuration(audio.duration),
          };
        });
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.load();

      return { audio, handleLoadedMetadata };
    });

    return () => {
      isCancelled = true;
      audioElements.forEach(({ audio, handleLoadedMetadata }) => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      });
    };
  }, [catalogTracks]);

  function handleDragStart(event: DragEvent<HTMLButtonElement>, trackId: string) {
    event.dataTransfer.setData('text/plain', trackId);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function playTrack(track: CatalogTrack) {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = track.src;
    audio.load();

    try {
      await audio.play();
      setActiveTrack(track);
      setIsPlaying(true);
    } catch {
      setActiveTrack(track);
      setIsPlaying(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const trackId = event.dataTransfer.getData('text/plain');
    if (!trackId) return;

    const selectedTrack = catalogTracks.find((track) => track.id === trackId);
    if (selectedTrack) {
      void playTrack(selectedTrack);
    }
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !hasActiveTrack) return;

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const nextTime = Math.max(0, Math.min(audio.currentTime + seconds, duration || audio.currentTime + seconds));
    audio.currentTime = nextTime;
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !hasActiveTrack) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  }

  function stopPlayback() {
    const audio = audioRef.current;
    if (!audio || !hasActiveTrack) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }

  return (
    <main className="page-shell">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} />

      <section className="hero-section">
        <div className="hero-media" aria-label="Aiya Kareem portrait">
          <div className="hero-image" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">Aiya Kareem</h1>
          </div>
        </div>
      </section>

      <section className="music-station-section">
        <div className="station-layout">
          <div className="catalog-panel">
            <div className="station-top">
              <div>
                <span className="station-label">Catalog</span>
                <h2>Drag a track</h2>
              </div>
            </div>
            <p className="station-copy">Pick a record from Aiya&apos;s collection and drop it onto the player.</p>
            <div className="track-list">
              {catalogTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="track-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, track.id)}
                >
                  <span>{track.title}</span>
                  <span>{trackDurations[track.id] ?? '--:--'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="player-panel">
            <div
              className={`record-player ${playerStateClass}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              aria-label={activeTrack ? `${activeTrack.title} on the record player` : 'Record player drop zone'}
            >
              <div className="record-base">
                <div className="record-stack">
                  <div className="record" />
                  <div className="record-label" />
                </div>
              </div>
              <div className="tonearm" />
              <div className="player-light" />
            </div>
            <div className="player-info">
              <span className="station-label">Vinyl Station</span>
              <h2>{activeTrack ? 'Now spinning' : 'Ready to play'}</h2>
              <p>{activeTrack ? `${activeTrack.title} is on the platter.` : 'Drag a song from the catalog into the player to start the groove.'}</p>
              <div className="player-controls" aria-label="Music player controls">
                <button type="button" className="player-control" onClick={() => seekBy(-10)} disabled={!hasActiveTrack} aria-label="Rewind 10 seconds">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M11 7.2V16.8L4.5 12L11 7.2Z" fill="currentColor" />
                    <path d="M19.5 7.2V16.8L13 12L19.5 7.2Z" fill="currentColor" />
                  </svg>
                </button>
                <button type="button" className="player-control" onClick={stopPlayback} disabled={!hasActiveTrack} aria-label="Stop music">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
                  </svg>
                </button>
                <button type="button" className="player-control player-control-primary" onClick={() => void togglePlayback()} disabled={!hasActiveTrack} aria-label={isPlaying ? 'Pause music' : 'Play music'}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {isPlaying ? (
                      <>
                        <rect x="7" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
                        <rect x="13.5" y="6.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
                      </>
                    ) : (
                      <path d="M8 6.8V17.2L17 12L8 6.8Z" fill="currentColor" />
                    )}
                  </svg>
                </button>
                <button type="button" className="player-control" onClick={() => seekBy(10)} disabled={!hasActiveTrack} aria-label="Fast forward 10 seconds">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M13 7.2V16.8L19.5 12L13 7.2Z" fill="currentColor" />
                    <path d="M4.5 7.2V16.8L11 12L4.5 7.2Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <div className={`player-status ${isPlaying ? 'playing' : ''}`}>
                {activeTrack ? (isPlaying ? 'Playing' : 'Paused') : 'Standby'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-copy">
          <h2>About Aiya</h2>
          <p>
            Dutch-born and Brooklyn-hailed, Aiya Kareem is R&amp;B&apos;s effervescent songstress. She finds herself in idols Lauryn Hill, Whitney Houston, Bob Marley and Michael Jackson. Breathing out the influence of her idols, Aiya&apos;s work is a heartfelt reflection of her personal experiences, from heartbreak to womanly triumph. She tackled pandemic loneliness with 2021&apos;s &ldquo;City On Lockdown&rdquo;, and went yin-yang with a double-single release &ldquo;Only Fans&rdquo; and &ldquo;Weak,&rdquo; featuring Grammy-winning singer-songwriter Justin Love.
          </p>
          <p>
            Her latest project, &ldquo;TWO DOZENS&rdquo; is a feat of independent artist creativity: 12 songs, 12 videos, in 24 weeks all on an iPhone. This project is a titan achievement showcasing what independent artists are capable of.
          </p>
          <p>
            Aiya Kareem is not your regular R&amp;B girl, she is a world-builder, an emotional conduit, and a shoulder to lean on. This is her world.
          </p>
        </div>
        <div className="about-details">
          <div>
            <span>Origin</span>
            <p>Brooklyn, New York</p>
          </div>
          <div>
            <span>Vibe</span>
            <p>Warm, bold, rhythm-first</p>
          </div>
          <div>
            <span>Latest</span>
            <p>New single out now</p>
          </div>
        </div>
      </section>

      <section className="parallax-section" />

      <section className="tour-section">
        <div className="tour-copy">
          <h2>Upcoming Shows</h2>
          <p>Currently No tour dataes available</p>
        </div>
      </section>

      <section className="contact-section">
        <div>
          <h2>Book & contact</h2>
          <p>For press, bookings, and collaborations, reach out through the link below.</p>
        </div>
        <a href="mailto:hello@aiyakareem.com" className="contact-link">hello@aiyakareem.com</a>
      </section>
    </main>
  );
}
