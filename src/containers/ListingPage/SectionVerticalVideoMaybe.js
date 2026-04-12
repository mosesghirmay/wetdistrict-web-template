import React, { useRef, useState } from 'react';
import css from './ListingPage.module.css';
import { Heading } from '../../components';

const SectionVerticalVideoMaybe = props => {
  const { videoUrl } = props;
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  if (!videoUrl) return null;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = e => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleEnded = () => setPlaying(false);

  return (
    <section className={css.sectionVerticalVideo}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        Promo Video
      </Heading>
      <div className={css.verticalVideoWrapper} onClick={togglePlay}>
        <video
          ref={videoRef}
          src={videoUrl}
          className={css.verticalVideo}
          muted
          playsInline
          loop={false}
          onEnded={handleEnded}
          preload="metadata"
        />

        {/* Play/pause overlay */}
        {!playing && (
          <div className={css.videoPlayOverlay}>
            <div className={css.videoPlayIcon}>
              <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mute toggle — bottom right */}
        <button
          className={css.videoMuteButton}
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            /* muted icon */
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97V10.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            /* unmuted icon */
            <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>
    </section>
  );
};

export default SectionVerticalVideoMaybe;
