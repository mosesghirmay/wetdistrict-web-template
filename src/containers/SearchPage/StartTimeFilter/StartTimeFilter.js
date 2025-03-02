import React from 'react';
import PropTypes from 'prop-types';
import css from './StartTimeFilter.module.css';

const StartTimeFilter = ({ id, label }) => {
  return (
    <div className={css.filterWrapper}>
      <label htmlFor={id} className={css.filterLabel}>{label}</label>
      <select id={id} className={css.filterSelect}>
        <option value="10:00">10:00 AM</option>
        <option value="14:00">2:00 PM</option>
        <option value="18:00">6:00 PM</option>
      </select>
    </div>
  );
};

StartTimeFilter.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default StartTimeFilter;
