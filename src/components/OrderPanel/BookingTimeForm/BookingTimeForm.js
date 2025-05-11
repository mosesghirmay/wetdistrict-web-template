import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { timestampToDate } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, H6, PrimaryButton, FieldSelect } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';

import css from './BookingTimeForm.module.css';

// When the values of the form are updated we need to fetch
// lineItems from this template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.
const handleFetchLineItems = props => formValues => {
  console.log('🔍 handleFetchLineItems called');
  console.log('Props:', props);
  console.log('Form values:', formValues);
  
  const {
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    seatsEnabled,
  } = props;
  
  const { bookingStartTime, bookingEndTime, seats, priceVariantName } = formValues.values;
  
  console.log('Extracted values:', {
    bookingStartTime,
    bookingEndTime,
    seats,
    priceVariantName
  });
  
  const startDate = bookingStartTime ? timestampToDate(bookingStartTime) : null;
  const endDate = bookingEndTime ? timestampToDate(bookingEndTime) : null;
  
  // Check if we have both start and end times before proceeding
  if (!bookingStartTime || !bookingEndTime) {
    console.warn('No booking times available yet - skipping line items fetch');
    return;
  }

  // Note: we expect values bookingStartTime and bookingEndTime to be strings
  // which is the default case when the value has been selected through the form
  // Parse to integers to ensure proper comparison
  const startTimeInt = parseInt(bookingStartTime, 10);
  const endTimeInt = parseInt(bookingEndTime, 10);
  const isStartBeforeEnd = startTimeInt < endTimeInt;
  
  if (!isStartBeforeEnd) {
    console.error('⛔️ Booking failed: Start time must be before end time', {
      bookingStartTime,
      bookingEndTime,
      startTimeInt,
      endTimeInt
    });
    return;
  }
  
  console.log('🧾 Submitting booking with values:', {
    priceVariantName,
    startDate,
    endDate
  });

  const seatsMaybe = seatsEnabled && seats > 0 ? { seats: parseInt(seats, 10) } : {};
  
  // For new listings with price variants, always include the variant name and unitType
  const priceVariantMaybe = priceVariantName
    ? { priceVariantName, unitType: 'hour' }
    : {};
  console.log('Price variant in order data:', priceVariantMaybe);

  if (bookingStartTime && bookingEndTime && isStartBeforeEnd && !fetchLineItemsInProgress) {
    // Ensure we have valid Date objects before proceeding
    if (!startDate || !endDate || startDate.getFullYear() === 1970 || endDate.getFullYear() === 1970) {
      console.warn('⛔ Fixing invalid dates for speculate call');
      // Create valid dates based on timestamps if needed
      const fixedStartDate = startDate?.getFullYear() === 1970 ? new Date() : startDate;
      const fixedEndDate = endDate?.getFullYear() === 1970 ? new Date(fixedStartDate.getTime() + 3600000) : endDate;
      
      const orderData = {
        bookingStart: fixedStartDate,
        bookingEnd: fixedEndDate,
        ...seatsMaybe,
        ...priceVariantMaybe,
      };
      
      console.log('📦 fetchSpeculatedTransaction called with fixed dates:', {
        bookingStart: fixedStartDate,
        bookingEnd: fixedEndDate,
        priceVariantName,
      });
      
      onFetchTransactionLineItems({
        orderData,
        listingId,
        isOwnListing,
      });
      return;
    }
    
    const orderData = {
      bookingStart: startDate,
      bookingEnd: endDate,
      ...seatsMaybe,
      ...priceVariantMaybe,
    };
    console.log('📦 fetchSpeculatedTransaction called with:', orderData);
    console.log('📡 About to call onFetchTransactionLineItems with:', {
      orderData,
      listingId,
      isOwnListing
    });
    
    onFetchTransactionLineItems({
      orderData,
      listingId,
      isOwnListing,
    }).then(res => {
      console.log('✅ Flex API response for line items:', res);
    }).catch(err => {
      console.error('❌ Flex API error while fetching line items:', err);
    });
    
    console.log('✅ onFetchTransactionLineItems called');
  }
};

const onPriceVariantChange = props => value => {
  const { form: formApi, seatsEnabled, values, handleFetchLineItems } = props;
  console.log('Price variant changed to:', value);

  // If we already have booking dates/times selected, keep them and just update the price variant
  const keepExistingBooking = values?.bookingStartDate && values?.bookingStartTime && values?.bookingEndTime;
  
  if (keepExistingBooking) {
    console.log('Keeping existing booking times while changing price variant');
    // Only update the price variant, then fetch line items with the new price variant
    formApi.change('priceVariantName', value);
    
    // Need to fetch line items with updated price variant
    setTimeout(() => {
      if (handleFetchLineItems) {
        handleFetchLineItems({
          values: {
            ...values,
            priceVariantName: value
          }
        });
      }
    }, 100);
  } else {
    // Clear booking data if we're selecting a price variant for the first time
    formApi.batch(() => {
      formApi.change('bookingStartDate', null);
      formApi.change('bookingStartTime', null);
      formApi.change('bookingEndTime', null);
      if (seatsEnabled) {
        formApi.change('seats', 1);
      }
    });
  }
};

/**
 * A form for selecting booking time.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {propTypes.money} props.price - The unit price of the listing
 * @param {boolean} props.isOwnListing - Whether the listing is owned by the current user
 * @param {propTypes.uuid} props.listingId - The ID of the listing
 * @param {Object} props.monthlyTimeSlots - The monthly time slots
 * @param {Function} props.onFetchTimeSlots - The function to fetch the time slots
 * @param {string} props.timeZone - The time zone of the listing (e.g. "America/New_York")
 * @param {Function} props.onFetchTransactionLineItems - The function to fetch the transaction line items
 * @param {Object} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching line items
 * @param {string} [props.startDatePlaceholder] - The placeholder text for the start date
 * @param {string} [props.endDatePlaceholder] - The placeholder text for the end date
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {string} props.marketplaceName - Name of the marketplace
 * @param {Array<Object>} [props.priceVariants] - The price variants
 * @param {ReactNode} [props.priceVariantFieldComponent] - The component to use for the price variant field
 * @param {boolean} props.isPublishedListing - Whether the listing is published
 * @returns {JSX.Element}
 */
export const BookingTimeForm = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    price: unitPrice,
    dayCountAvailableForBooking,
    marketplaceName,
    seatsEnabled,
    isPriceVariationsInUse,
    priceVariants = [],
    priceVariantFieldComponent: PriceVariantFieldComponent,
    preselectedPriceVariant,
    isPublishedListing,
    ...rest
  } = props;

  const [seatsOptions, setSeatsOptions] = useState([1]);
  const initialValuesMaybe =
    priceVariants.length > 1 && preselectedPriceVariant
      ? { initialValues: { priceVariantName: preselectedPriceVariant?.name } }
      : priceVariants.length === 1
      ? { initialValues: { priceVariantName: priceVariants[0]?.name } }
      : preselectedPriceVariant
      ? { initialValues: { priceVariantName: preselectedPriceVariant?.name } }
      : {};
      
  console.log('📝 Form initialization:', {
    initialValuesMaybe,
    priceVariants,
    preselectedPriceVariant,
    isPriceVariationsInUse
  });

  const classes = classNames(rootClassName || css.root, className);

  return (
    <FinalForm
      {...initialValuesMaybe}
      {...rest}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          form,
          pristine,
          handleSubmit,
          isOwnListing,
          listingId,
          values,
          monthlyTimeSlots,
          timeSlotsForDate,
          onFetchTimeSlots,
          timeZone,
          lineItems,
          fetchLineItemsInProgress,
          fetchLineItemsError,
          payoutDetailsWarning,
        } = formRenderProps;

        const startTime = values?.bookingStartTime ? values.bookingStartTime : null;
        const endTime = values?.bookingEndTime ? values.bookingEndTime : null;
        const startDate = startTime ? timestampToDate(startTime) : null;
        const endDate = endTime ? timestampToDate(endTime) : null;
        const priceVariantName = values?.priceVariantName || null;

        // This is the place to collect breakdown estimation data. See the
        // EstimatedCustomerBreakdownMaybe component to change the calculations
        // for customized payment processes.
        const breakdownData =
          startDate && endDate
            ? {
                startDate,
                endDate,
                priceVariantName, // Include price variant name in breakdown data
              }
            : null;

        // Debug price variant issue
        console.log('BookingTimeForm state:', {
          priceVariantName,
          startDate,
          endDate,
          lineItemsExist: !!lineItems,
          fetchInProgress: fetchLineItemsInProgress,
          fetchError: !!fetchLineItemsError,
          isPriceVariationsInUse
        });

        const showEstimatedBreakdown =
          breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;
          
        console.log('🔄 BookingTimeForm Render State:', {
          hasBreakdownData: !!breakdownData,
          breakdownData,
          hasLineItems: !!lineItems,
          lineItemsCount: lineItems?.length,
          lineItems,
          fetchLineItemsInProgress,
          fetchLineItemsError,
          showEstimatedBreakdown,
          priceVariantName,
          isPriceVariationsInUse,
          priceVariants
        });

        const onHandleFetchLineItems = handleFetchLineItems(props);
        const submitDisabled = isPriceVariationsInUse && !isPublishedListing;

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            {PriceVariantFieldComponent ? (
              <PriceVariantFieldComponent
                priceVariants={priceVariants}
                priceVariantName={priceVariantName}
                onPriceVariantChange={onPriceVariantChange({
                  ...formRenderProps,
                  handleFetchLineItems: onHandleFetchLineItems
                })}
                disabled={!isPublishedListing}
              />
            ) : null}

            {monthlyTimeSlots && timeZone ? (
              <FieldDateAndTimeInput
                seatsEnabled={seatsEnabled}
                setSeatsOptions={setSeatsOptions}
                startDateInputProps={{
                  label: intl.formatMessage({ id: 'BookingTimeForm.bookingStartTitle' }),
                  placeholderText: startDatePlaceholder,
                }}
                endDateInputProps={{
                  label: intl.formatMessage({ id: 'BookingTimeForm.bookingEndTitle' }),
                  placeholderText: endDatePlaceholder,
                }}
                className={css.bookingDates}
                listingId={listingId}
                onFetchTimeSlots={onFetchTimeSlots}
                monthlyTimeSlots={monthlyTimeSlots}
                timeSlotsForDate={timeSlotsForDate}
                values={values}
                intl={intl}
                form={form}
                pristine={pristine}
                disabled={isPriceVariationsInUse && !priceVariantName}
                timeZone={timeZone}
                dayCountAvailableForBooking={dayCountAvailableForBooking}
                handleFetchLineItems={onHandleFetchLineItems}
              />
            ) : null}
            {seatsEnabled ? (
              <FieldSelect
                name="seats"
                id="seats"
                disabled={!startTime}
                showLabelAsDisabled={!startTime}
                label={intl.formatMessage({ id: 'BookingTimeForm.seatsTitle' })}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      priceVariantName,
                      bookingStartDate: startDate,
                      bookingStartTime: startTime,
                      bookingEndDate: endDate,
                      bookingEndTime: endTime,
                      seats: values,
                    },
                  });
                }}
              >
                <option disabled value="">
                  {intl.formatMessage({ id: 'BookingTimeForm.seatsPlaceholder' })}
                </option>
                {seatsOptions.map(s => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </FieldSelect>
            ) : null}

            {showEstimatedBreakdown ? (
              <div className={css.priceBreakdownContainer}>
                <H6 as="h3" className={css.bookingBreakdownTitle}>
                  <FormattedMessage id="BookingTimeForm.priceBreakdownTitle" />
                </H6>
                <hr className={css.totalDivider} />
                <EstimatedCustomerBreakdownMaybe
                  breakdownData={breakdownData}
                  lineItems={lineItems}
                  timeZone={timeZone}
                  currency={unitPrice.currency}
                  marketplaceName={marketplaceName}
                  processName={BOOKING_PROCESS_NAME}
                />
              </div>
            ) : null}

            {fetchLineItemsError ? (
              <span className={css.sideBarError}>
                <FormattedMessage id="BookingTimeForm.fetchLineItemsError" />
              </span>
            ) : null}

            <div className={css.submitButton}>
              <PrimaryButton
                type="submit"
                inProgress={fetchLineItemsInProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="BookingTimeForm.requestToBook" />
              </PrimaryButton>
            </div>

            <p className={css.finePrint}>
              {payoutDetailsWarning ? (
                payoutDetailsWarning
              ) : (
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingTimeForm.ownListing'
                      : 'BookingTimeForm.youWontBeChargedInfo'
                  }
                />
              )}
            </p>
          </Form>
        );
      }}
    />
  );
};

export default BookingTimeForm;
