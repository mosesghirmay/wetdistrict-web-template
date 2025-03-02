import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { ValidationError } from '../../components';

import css from './FieldSelect.module.css';

/**
 * Select field component for Final Form.
 */
const FieldSelectComponent = ({
  rootClassName,
  className,
  selectClassName,
  id,
  label,
  input,
  meta,
  children,
  onChange,
  ...rest
}) => {
  if (label && !id) {
    throw new Error('id is required when a label is provided for accessibility.');
  }

  const { touched, invalid, error } = meta;
  const hasError = touched && invalid && error;

  // Apply error styling if validation fails
  const selectClasses = classNames(selectClassName, {
    [css.selectError]: hasError,
  });

  // Handle selection change
  const handleChange = e => {
    input.onChange(e);
    if (onChange) {
      onChange(e.currentTarget.value);
    }
  };

  return (
    <div className={classNames(rootClassName || css.root, className)}>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} className={selectClasses} {...input} onChange={handleChange} {...rest}>
        {children}
      </select>
      <ValidationError fieldMeta={meta} />
    </div>
  );
};

/**
 * Final Form Field wrapping <select> input
 *
 * @component
 * @param {Object} props
 * @param {string} props.name Name of the input in Final Form
 * @param {string?} props.className Additional style rules for the root container
 * @param {string?} props.rootClassName Override default root class
 * @param {string?} props.selectClassName Additional styles for <select> component
 * @param {string} props.id Required if a label is provided, ensures accessibility
 * @param {ReactNode} props.label Display label for select field
 * @param {ReactNode} props.children Options inside <select>
 * @returns {JSX.Element} Final Form Field containing <select> input
 */
const FieldSelect = props => <Field component={FieldSelectComponent} {...props} />;

export default FieldSelect;
