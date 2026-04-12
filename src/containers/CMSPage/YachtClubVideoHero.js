import React from 'react';
import css from './YachtClubVideoHero.module.css';

const DRIVE_FILE_ID = '1m3Z-RpOVZ12Fsf6roM9f6z6fAR1VSpWB';
const EMBED_URL = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`;

/**
 * Full-width 9:16 vertical video hero for the Yacht Club page.
 * Embeds the promo video from Google Drive via iframe.
 */
const YachtClubVideoHero = () => {
  return (
    <div className={css.root}>
      <div className={css.videoWrapper}>
        <iframe
          className={css.iframe}
          src={EMBED_URL}
          allow="autoplay"
          allowFullScreen
          frameBorder="0"
          title="Yacht Club Promo Video"
        />
      </div>
    </div>
  );
};

export default YachtClubVideoHero;
