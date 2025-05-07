import React from 'react';
import classNames from 'classnames';

import FilterPlain from '../FilterPlain/FilterPlain';
import FilterPopup from '../FilterPopup/FilterPopup';
import FieldSelectCapacity from './FieldSelectCapacity';

import { FormattedMessage } from '../../../util/reactIntl';
import css from './CapacityFilter.module.css';

// Converts the query parameter to an object
const convertQueryParamToObject = value => {
  if (!value) return null;
  
  // Handle plain numeric value
  const intValue = Number.parseInt(value, 10);
  return !isNaN(intValue) ? { capacity: intValue } : null;
};

// Formats the value for the query parameter
const formatToQueryParam = (value, queryParamName) => {
  const capacity = value?.capacity;
  
  // Return the original parameter name with the value
  if (capacity != null) {
    return { [queryParamName]: capacity.toString() };
  }
  
  return { [queryParamName]: null };
};

/**
 * CapacityFilter component
 */
const CapacityFilter = props => {
  const {
    className,
    rootClassName,
    id,
    label,
    queryParamNames,
    initialValues,
    min,
    max,
    step,
    onSubmit,
    showAsPopup = true,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  // Extract initial values for form from query parameters
  const queryParamName = queryParamNames[0];
  const capacityValue = initialValues && initialValues[queryParamName];
  
  // Parse the capacity value
  const initialCapacity = capacityValue 
    ? convertQueryParamToObject(capacityValue)
    : null;

  const hasInitialValues = initialCapacity?.capacity != null;
  const resolvedInitialValues = { capacity: hasInitialValues ? initialCapacity : {} };

  // Handle form submission
  const handleSubmit = values => {
    // Extract the capacity value from the form values
    const usedValue = values?.capacity ? values.capacity : values;
    
    // Format and submit the parameters for filtering
    const params = formatToQueryParam(usedValue, queryParamName);
    
    return onSubmit(params);
  };

  // Used to display the selected value above the filter component
  const labelSelectionForPlain = hasInitialValues ? (
    <FormattedMessage id="CapacityFilter.labelSelected" values={{ capacity: initialCapacity.capacity }} />
  ) : null;

  return showAsPopup ? (
    <FilterPopup
      className={classes}
      rootClassName={rootClassName}
      label={label}
      isSelected={hasInitialValues}
      id={`${id}.popup`}
      showAsPopup
      onSubmit={handleSubmit}
      initialValues={resolvedInitialValues}
      {...rest}
    >
      <FieldSelectCapacity
        min={min}
        max={max}
        step={step}
        name="capacity"
        initialValues={resolvedInitialValues}
      />
    </FilterPopup>
  ) : (
    <FilterPlain
      className={classes}
      rootClassName={rootClassName}
      label={label}
      labelSelection={labelSelectionForPlain}
      labelSelectionSeparator=":"
      isSelected={hasInitialValues}
      id={`${id}.plain`}
      liveEdit
      onSubmit={handleSubmit}
      initialValues={resolvedInitialValues}
      {...rest}
    >
      <FieldSelectCapacity
        min={min}
        max={max}
        step={step}
        name="capacity"
        initialValues={resolvedInitialValues}
      />
    </FilterPlain>
  );
};

export default CapacityFilter;