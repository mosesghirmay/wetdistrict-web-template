import React from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { requiredFieldArrayCheckbox } from '../../../util/validators';
import { ValidationError } from '../../../components';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';

import css from './TermsAndConditions.module.css';

const KEY_CODE_ENTER = 13;

/**
 * A component that renders the terms and conditions.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onOpenTermsOfService - The function to open the terms of service modal
 * @param {Function} props.onOpenPrivacyPolicy - The function to open the privacy policy modal
 * @param {string} props.formId - The form id
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const TermsAndConditions = props => {
  const { onOpenTermsOfService, onOpenPrivacyPolicy, formId, intl } = props;

  const handleClick = callback => e => {
    e.preventDefault();
    callback(e);
  };
  const handleKeyUp = callback => e => {
    // Allow click action with keyboard like with normal links
    if (e.keyCode === KEY_CODE_ENTER) {
      callback();
    }
  };

  const termsLink = (
    <span
      className={css.termsLink}
      onClick={handleClick(onOpenTermsOfService)}
      role="button"
      tabIndex="0"
      onKeyUp={handleKeyUp(onOpenTermsOfService)}
    >
      <FormattedMessage id="AuthenticationPage.termsAndConditionsTermsLinkText" />
    </span>
  );

  const privacyLink = (
    <span
      className={css.privacyLink}
      onClick={handleClick(onOpenPrivacyPolicy)}
      role="button"
      tabIndex="0"
      onKeyUp={handleKeyUp(onOpenPrivacyPolicy)}
    >
      <FormattedMessage id="AuthenticationPage.termsAndConditionsPrivacyLinkText" />
    </span>
  );

  const fieldId = formId ? `${formId}.terms-accepted` : 'terms-accepted';
  const errorMessage = intl.formatMessage({ id: 'AuthenticationPage.termsAndConditionsAcceptRequired' });

  return (
    <div className={css.root}>
      <Field
        name="terms"
        validate={requiredFieldArrayCheckbox(errorMessage)}
        type="checkbox"
        value="tos-and-privacy"
      >
        {({ input, meta }) => {
          const { checked, ...inputProps } = input;
          return (
            <div>
              <label htmlFor={fieldId} className={css.finePrint}>
                <span
                  className={classNames(css.customCheckbox, { [css.checked]: checked })}
                ></span>
                <span className={css.termsText}>
                  {intl.formatMessage(
                    { id: 'AuthenticationPage.termsAndConditionsAcceptText' },
                    { termsLink, privacyLink }
                  )}
                </span>
                <input
                  id={fieldId}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  {...inputProps}
                />
              </label>
              {meta.touched && meta.error ? (
                <ValidationError fieldMeta={meta} />
              ) : null}
            </div>
          );
        }}
      </Field>
    </div>
  );
};

export default TermsAndConditions;
