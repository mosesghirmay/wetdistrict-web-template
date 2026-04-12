import React from 'react';
import css from './YachtClubVideoHero.module.css';

const DRIVE_FILE_ID = '1m3Z-RpOVZ12Fsf6roM9f6z6fAR1VSpWB';
const EMBED_URL = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`;

const YachtClubVideoHero = _props => {
  return (
    <div className={css.root}>
      {/* Outer box clips to 70vh; inner box is always a true 9:16 shape */}
      <div className={css.videoWrapper}>
        <div className={css.iframeContainer}>
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
    </div>
  );
};

export default YachtClubVideoHero;
