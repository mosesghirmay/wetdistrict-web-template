import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import css from './GuestsFilter.css';

/**
 * A simpler direct dropdown component for guest selection
 */
const GuestsFilterComponent = props => {
  const {
    rootClassName,
    className,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    onSubmit,
    intl,
    options,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  
  const queryParamName = Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
  
  // Get initial value from URL parameters (if available)
  let initialGuestCount = null;
  if (initialValues && initialValues[queryParamName]) {
    const paramValue = initialValues[queryParamName];
    
    // Check if it's a range format (contains a comma)
    if (paramValue.includes(',')) {
      const parts = paramValue.split(',');
      // Use the first non-empty value, preferring the second one (max)
      initialGuestCount = parts[1] || parts[0] || null;
    } else {
      // It's already a single value
      initialGuestCount = paramValue;
    }
    
    console.log(`Initial guest count: ${initialGuestCount} from param value: ${paramValue}`);
  }

  const [selectedGuests, setSelectedGuests] = useState(initialGuestCount || '');

  const handleGuestChange = (event) => {
    const guestCount = event.target.value;
    setSelectedGuests(guestCount);
    
    if (guestCount) {
      // Use a range to show all listings that can handle this capacity or more
      // The format is "minValue,maxValue" where minValue is what we're filtering by
      // and maxValue can be the same or higher (we use the same for simplicity)
      const submitParam = { [queryParamName]: `${guestCount},${guestCount}` };
      
      // For debugging
      console.log(`Submitting guest count range: ${guestCount},${guestCount} for param: ${queryParamName}`);
      onSubmit(submitParam);
    } else {
      // Clear the filter if no value is selected
      onSubmit({ [queryParamName]: null });
    }
  };

  return (
    <div className={classes}>
      <div className={css.filterContainer}>
        <div className={css.filterHeader}>
          {label && <label htmlFor={id} className={css.label}>{label}:</label>}
        </div>
        <div className={css.selectWrapper}>
          <select 
            id={id}
            name={name || 'guestCount'}
            value={selectedGuests}
            onChange={handleGuestChange}
            className={css.select}
          >
            <option value="" disabled>How many guests</option>
            {options.map(option => (
              <option key={option.option} value={option.option}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

GuestsFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  options: []
};

GuestsFilterComponent.propTypes = {
  rootClassName: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string,
  label: PropTypes.string,
  queryParamNames: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  intl: intlShape.isRequired
};

const GuestsFilter = injectIntl(GuestsFilterComponent);

export default GuestsFilter;