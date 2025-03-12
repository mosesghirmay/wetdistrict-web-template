import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError } from '../../components';

import css from './FieldSelectOne.module.css';

/**
 * A field component that replaces dropdowns with button-style selections.
 */
const FieldSelectOneComponent = ({ rootClassName, className, options, id, label, input, meta }) => {
  if (label && !id) {
    throw new Error('id is required when a label is provided for accessibility.');
  }

  const { touched, invalid, error } = meta;
  const hasError = touched && invalid && error;

  return (
    <div className={classNames(rootClassName || css.root, className)}>
      {label && <label className={css.label}>{label}</label>}
      <div className={css.optionsContainer}>
        {options.map(option => (
          <label
            key={option.value}
            className={classNames(css.optionButton, {
              [css.selected]: input.value === option.value,
            })}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={input.value === option.value}
              onChange={e => input.onChange(e.target.value)}
              className={css.input}
            />
            {option.label}
          </label>
        ))}
      </div>
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

// Ensure it is a **named export**
export const FieldSelectOne = props => <Field component={FieldSelectOneComponent} {...props} />;
