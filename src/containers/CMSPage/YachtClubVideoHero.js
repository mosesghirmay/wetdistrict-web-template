import React from 'react';
import css from './YachtClubVideoHero.module.css';

const DRIVE_FILE_ID = '1m3Z-RpOVZ12Fsf6roM9f6z6fAR1VSpWB';
const EMBED_URL = `https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`;

const YachtClubVideoHero = _props => {
  return (
    <div className={css.root}>
      {/*
       * videoWrapper is mathematically 9:16:
       *   height = 70vh
       *   width  = 70vh * 9/16
       * The iframe fills it 100×100% so Drive renders into a correct shape.
       */}
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
