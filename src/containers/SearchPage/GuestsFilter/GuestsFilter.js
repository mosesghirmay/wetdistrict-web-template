import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import css from './GuestsFilter.module.css';

/**
 * A simpler direct dropdown component for guest selection
 */
const GuestsFilterComponent = ({
  rootClassName = null,
  className = null,
  id,
  name,
  label,
  queryParamNames,
  initialValues = null,
  onSubmit,
  intl,
  options = [],
  ...rest
}) => {

  // Always use pub_capacity as the parameter name
  const queryParamName = 'pub_capacity';
  
  // Get initial value from URL parameters (if available)
  let initialGuestCount = null;
  if (initialValues && initialValues[queryParamName]) {
    const paramValue = initialValues[queryParamName];
    
    // Check if it's a range format (contains a comma)
    if (paramValue.includes(',')) {
      const parts = paramValue.split(',');
      // For range min,max or min, format, use the minimum value
      initialGuestCount = parts[0] || null;
    } else {
      // It's already a single value
      initialGuestCount = paramValue;
    }
  }

  const [selectedGuests, setSelectedGuests] = useState(initialGuestCount || '');
  const [isSelected, setIsSelected] = useState(!!initialGuestCount);

  const handleGuestChange = (event) => {
    const guestCount = event.target.value;
    setSelectedGuests(guestCount);
    setIsSelected(!!guestCount);
    
    if (guestCount) {
      // Use a minimum range format to show all listings with capacity >= selected value
      // Format "min," means "at least min capacity" (no upper bound)
      const submitParam = { [queryParamName]: `${guestCount},` };
      onSubmit(submitParam);
    } else {
      // Clear the filter if no value is selected
      onSubmit({ [queryParamName]: null });
    }
  };
  
  // Format the selected value with the appropriate "guest" or "guests" text
  const formattedGuestCount = selectedGuests ? 
    `${selectedGuests} ${selectedGuests === '1' ? 
      intl.formatMessage({ id: 'GuestsFilter.guest' }) : 
      intl.formatMessage({ id: 'GuestsFilter.guests' })}` : 
    '';

  const classes = classNames(
    rootClassName || css.root, 
    className,
    { [css.selected]: isSelected }
  );

  return (
    <div className={classes}>
      <div className={css.filterContainer}>
        <div className={css.filterHeader}>
          {label && <label htmlFor={id} className={css.label}>{label}:</label>}
        </div>
        <div className={css.selectWrapper}>
          {isSelected && (
            <div className={css.selectedValue}>{formattedGuestCount}</div>
          )}
          <select 
            id={id}
            name={name || 'guestCount'}
            value={selectedGuests}
            onChange={handleGuestChange}
            className={classNames(css.select, {
              [css.hasValue]: isSelected
            })}
          >
            <option value="" disabled>{intl.formatMessage({ id: 'GuestsFilter.placeholder' })}</option>
            {options.map(option => (
              <option key={option.option} value={option.option}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className={css.capacityNote}>
          {intl.formatMessage({ id: 'GuestsFilter.capacityNote' })}
        </div>
      </div>
    </div>
  );
};

// Using JavaScript default parameters instead of defaultProps

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