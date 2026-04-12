import React from 'react';
import css from './YachtClubVideoHero.module.css';

// Bunny Stream: library 636214, video dda5ef3f-eef0-4216-84e2-b451e2e73f85
const EMBED_URL =
  'https://iframe.mediadelivery.net/embed/636214/dda5ef3f-eef0-4216-84e2-b451e2e73f85' +
  '?autoplay=false&loop=false&muted=false&preload=true&responsive=false';

const YachtClubVideoHero = _props => {
  return (
    <div className={css.root}>
      {/*
       * videoWrapper is mathematically 9:16:
       *   height = 70vh
       *   width  = 70vh * 9/16
       * The iframe fills it exactly so Bunny renders with no black bars.
       */}
      <div className={css.videoWrapper}>
        <iframe
          className={css.iframe}
          src={EMBED_URL}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          frameBorder="0"
          title="Yacht Club Promo Video"
        />
      </div>
    </div>
  );
};

export default YachtClubVideoHero;
