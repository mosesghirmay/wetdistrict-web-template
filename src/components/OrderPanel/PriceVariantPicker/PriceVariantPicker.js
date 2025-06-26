import React from 'react';
import { Field } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { createSlug } from '../../../util/urlHelpers';

import { FieldSelect } from '../../../components';

import css from './PriceVariantPicker.module.css';

// Removed DEFAULT_PRICE_VARIANT_NAME constant

const VariantNameMaybe = props => {
  const { className, priceVariant } = props;
  return priceVariant?.name ? (
    <div className={className}>
      <FormattedMessage
        id="PriceVariantPicker.onePriceVariantOnly"
        values={{ priceVariantName: priceVariant?.name }}
      />
    </div>
  ) : null;
};

const FieldHidden = props => {
  const { name, value, ...rest } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.hidden} value={value} {...rest}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

const PriceVariantPicker = props => {
  const intl = useIntl();
  const { priceVariants, onPriceVariantChange, disabled } = props;
  const hasMultiplePriceVariants = priceVariants?.length > 1;
  const hasOnePriceVariant = priceVariants?.length === 1;

  return hasMultiplePriceVariants ? (
    <FieldSelect
      name="priceVariantName"
      id="priceVariant"
      className={css.priceVariantFieldSelect}
      selectClassName={css.priceVariantSelect}
      label={intl.formatMessage({ id: 'PriceVariantPicker.priceVariantLabel' })}
      onChange={onPriceVariantChange}
      disabled={disabled}
      showLabelAsDisabled={disabled}
    >
      <option disabled value="" key="unselected">
        {intl.formatMessage({ id: 'PriceVariantPicker.priceVariantUnselected' })}
      </option>
      {priceVariants.map(pv => (
        <option value={pv.name} key={pv.name} data-slug={createSlug(pv.name)}>
          {pv.name}
        </option>
      ))}
    </FieldSelect>
  ) : hasOnePriceVariant ? (
    <>
      <VariantNameMaybe priceVariant={priceVariants?.[0]} className={css.priceVariantName} />
      <FieldHidden
        name="priceVariantName"
        value={priceVariants[0].name}
      />
    </>
  ) : null;
};

export default PriceVariantPicker;
