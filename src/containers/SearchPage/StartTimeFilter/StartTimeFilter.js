import React from 'react';
import PropTypes from 'prop-types';
import { useFormState } from 'react-final-form';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../../util/reactIntl';

import { FieldSelect } from '../../../components';
import css from './StartTimeFilter.module.css';

/**
 * A specialized version of SelectSingleFilter for the StartTime filter
 */
const StartTimeFilterComponent = props => {
  const {
    rootClassName,
    className,
    id,
    name,
    label,
    queryParamNames,
    initialValues,
    onSubmit,
    showAsPopup,
    options,
    intl,
    ...rest
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const formState = useFormState();

  const handleSubmit = values => {
    const time = values[name];
    onSubmit({ [queryParamNames[0]]: time });
  };

  // Format options for select field
  const timeOptions = options.map(option => ({
    key: option.option,
    label: option.label
  }));

  return (
    <div className={classes}>
      <FieldSelect
        className={css.select}
        id={id}
        name={name}
        label={label}
        validate={v => {}}
        options={timeOptions}
        onChange={() => formState.dirty && handleSubmit(formState.values)}
      />
    </div>
  );
};

StartTimeFilterComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  showAsPopup: false,
};

StartTimeFilterComponent.propTypes = {
  rootClassName: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  queryParamNames: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  showAsPopup: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      option: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  intl: intlShape.isRequired,
};

const StartTimeFilter = injectIntl(StartTimeFilterComponent);

export default StartTimeFilter;
