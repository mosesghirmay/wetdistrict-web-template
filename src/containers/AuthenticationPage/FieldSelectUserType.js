import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldSelectOne } from '../../components/FieldSelect/FieldSelectOne';

import css from './AuthenticationPage.module.css';

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

/**
 * Return React Final Form Field that allows selecting user type with buttons instead of a dropdown.
 *
 * @component
 * @param {Object} props
 * @param {string} props.rootClassName - The root class that overrides the default class css.userTypeSelect
 * @param {string} props.className - The class that extends the root class
 * @param {string} props.name - The name of the field / input
 * @param {Array<propTypes.userType>} props.userTypes - The user types
 * @param {boolean} props.hasExistingUserType - Whether the user type already exists
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const FieldSelectUserType = props => {
  const { rootClassName, className, name, userTypes, hasExistingUserType, intl } = props;
  const hasMultipleUserTypes = userTypes?.length > 1;
  const classes = classNames(rootClassName || css.userTypeSelect, className);

  return hasMultipleUserTypes && !hasExistingUserType ? (
    <>
      <FieldSelectOne
        id={name}
        name={name}
        className={classes}
        label={intl.formatMessage({ id: 'FieldSelectUserType.label' })}
        options={userTypes.map(config => ({
          value: config.userType,
          label: config.label,
        }))}
        validate={validators.required(intl.formatMessage({ id: 'FieldSelectUserType.required' }))}
      />
    </>
  ) : (
    <>
      <FieldHidden name={name} />
    </>
  );
};

export default FieldSelectUserType;
