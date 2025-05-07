import React, { useEffect, useState } from 'react';
import { Field } from 'react-final-form';
import { FieldSelect } from '../../../components';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import css from './CapacityFilter.module.css';

// Generate options from min to max with the specified step
const generateOptions = (min, max, step) => {
  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }
  return options;
};

const CapacitySelectInput = props => {
  const { input, min, max, step, initialValues } = props;
  const { value, onChange, name } = input;
  const intl = useIntl();
  
  const options = generateOptions(min, max, step);
  const initialCapacity = initialValues?.capacity?.capacity;
  const [selectedCapacity, setSelectedCapacity] = useState(initialCapacity);

  useEffect(() => {
    setSelectedCapacity(initialCapacity);
  }, [initialCapacity]);

  const handleChange = value => {
    // FieldSelect passes the value directly rather than an event
    const newValue = value ? Number.parseInt(value, 10) : null;
    setSelectedCapacity(newValue);
    onChange({ capacity: newValue });
  };

  return (
    <div className={css.selectWrapper}>
      <FieldSelect
        className={css.select}
        id="capacity"
        name="capacity"
        onChange={handleChange}
        value={selectedCapacity || ''}
      >
        <option value="">
          {intl.formatMessage({ id: 'CapacityFilter.selectPlaceholder' })}
        </option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </FieldSelect>
    </div>
  );
};

/**
 * FieldSelectCapacity component
 */
const FieldSelectCapacity = props => {
  const { min = 1, max = 16, step = 1, name, ...rest } = props;
  
  return (
    <Field
      component={CapacitySelectInput}
      min={min}
      max={max}
      step={step}
      name={name}
      {...rest}
    />
  );
};

export default FieldSelectCapacity;