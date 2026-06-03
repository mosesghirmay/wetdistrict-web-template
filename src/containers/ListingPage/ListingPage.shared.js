import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { types as sdkTypes } from '../../util/sdkLoader';
import { createResourceLocatorString, findRouteByRouteName } from '../../util/routes';
import { convertMoneyToNumber, formatMoney } from '../../util/currency';
import { timestampToDate } from '../../util/dates';
import { hasPermissionToInitiateTransactions, isUserAuthorized } from '../../util/userHelpers';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  createSlug,
} from '../../util/urlHelpers';

import { Page, LayoutSingleColumn } from '../../components';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './ListingPage.module.css';

/**
 * This file contains shared functions from each ListingPage variants.
 */

const { UUID } = sdkTypes;

/**
 * Helper to get formattedPrice and priceTitle for SectionHeading component.
 * @param {Money} price listing's price
 * @param {String} marketplaceCurrency currency of the price (e.g. 'USD')
 * @param {Object} intl React Intl instance
 * @returns Object literal containing formattedPrice and priceTitle
 */
export const priceData = (price, marketplaceCurrency, intl) => {
  if (price && price.currency === marketplaceCurrency) {
    const formattedPrice = formatMoney(intl, price);
    return { formattedPrice, priceTitle: formattedPrice };
  } else if (price) {
    return {
      formattedPrice: `(${price.currency})`,
      priceTitle: `Unsupported currency (${price.currency})`,
    };
  }
  return {};
};

/**
 * Converts Money object to number, which is needed for the search schema (for Google etc.)
 *
 * @param {Money} price
 * @returns {Money|null}
 */
export const priceForSchemaMaybe = price => {
  try {
    const schemaPrice = convertMoneyToNumber(price);
    return {
      price: schemaPrice.toFixed(2),
      priceCurrency: price.currency,
    };
  } catch (e) {
    return {};
  }
};

/**
 * Get category's label.
 *
 * @param {Array} categories array of category objects (key & label)
 * @param {String} value selected category value
 * @returns label for the selected value
 */
export const categoryLabel = (categories, value) => {
  const cat = categories.find(c => c.key === value);
  return cat ? cat.label : value;
};

/**
 * Filter listing images with correct custom image variant name.
 * Used for facebook, twitter and page schema images.
 *
 * @param {Listing} listing
 * @param {String} variantName
 * @returns correct image variant specified by variantName parameter.
 */
export const listingImages = (listing, variantName) =>
  (listing.images || [])
    .map(image => {
      const variants = image.attributes.variants;
      const variant = variants ? variants[variantName] : null;

      // deprecated
      // for backwards combatility only
      const sizes = image.attributes.sizes;
      const size = sizes ? sizes.find(i => i.name === variantName) : null;

      return variant || size;
    })
    .filter(variant => variant != null);

/**
 * Callback for the "contact" button on ListingPage to open inquiry modal.
 *
 * @param {Object} parameters all the info needed to open inquiry modal.
 */
export const handleContactUser = parameters => () => {
  const {
    history,
    params,
    currentUser,
    callSetInitialValues,
    location,
    routes,
    setInitialValues,
    setInquiryModalOpen,
  } = parameters;

  if (!currentUser) {
    const state = { from: `${location.pathname}${location.search}${location.hash}` };

    // We need to log in before showing the modal, but first we need to ensure
    // that modal does open when user is redirected back to this listingpage
    callSetInitialValues(setInitialValues, { inquiryModalOpenForListingId: params.id });

    // signup and return back to listingPage.
    history.push(createResourceLocatorString('SignupPage', routes, {}, {}), state);
  } else if (!isUserAuthorized(currentUser)) {
    // A user in pending-approval state can't contact the author (the same applies for a banned user)
    const pathParams = { missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL };
    history.push(createResourceLocatorString('NoAccessPage', routes, pathParams, {}));
  } else if (!hasPermissionToInitiateTransactions(currentUser)) {
    // A user in pending-approval state can't contact the author (the same applies for a banned user)
    const pathParams = { missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS };
    history.push(createResourceLocatorString('NoAccessPage', routes, pathParams, {}));
  } else {
    setInquiryModalOpen(true);
  }
};

/**
 * Callback for the inquiry modal to submit aka create inquiry transaction on ListingPage.
 * Note: this is for booking and purchase processes. Inquiry process is handled through handleSubmit.
 *
 * @param {Object} parameters all the info needed to create inquiry.
 */
export const handleSubmitInquiry = parameters => values => {
  const { history, params, getListing, onSendInquiry, routes, setInquiryModalOpen } = parameters;

  const listingId = new UUID(params.id);
  const listing = getListing(listingId);
  const { message } = values;

  onSendInquiry(listing, message.trim())
    .then(txId => {
      setInquiryModalOpen(false);

      // Redirect to OrderDetailsPage
      history.push(createResourceLocatorString('OrderDetailsPage', routes, { id: txId.uuid }, {}));
    })
    .catch(() => {
      // Ignore, error handling in duck file
    });
};

/**
 * Handle order submit from OrderPanel.
 *
 * @param {Object} parameters all the info needed to redirect user to CheckoutPage.
 */
export const handleSubmit = parameters => values => {
  const {
    history,
    params,
    currentUser,
    getListing,
    callSetInitialValues,
    onInitializeCardPaymentData,
    routes,
  } = parameters;
  const listingId = new UUID(params.id);
  const listing = getListing(listingId);

  const {
    bookingDates,
    bookingStartTime,
    bookingEndTime,
    bookingStartDate, // not relevant (omit)
    bookingEndDate, // not relevant (omit)
    priceVariantName, // relevant for bookings
    quantity: quantityRaw,
    seats: seatsRaw,
    deliveryMethod,
    ...otherOrderData
  } = values;

  const bookingMaybe = bookingDates
    ? {
        bookingDates: {
          bookingStart: bookingDates.startDate,
          bookingEnd: bookingDates.endDate,
        },
      }
    : bookingStartTime && bookingEndTime
    ? {
        bookingDates: {
          bookingStart: timestampToDate(bookingStartTime),
          bookingEnd: timestampToDate(bookingEndTime),
        },
      }
    : {};
  // priceVariantName is relevant for bookings
  const priceVariantNameMaybe = priceVariantName ? { priceVariantName } : {};
  const quantity = Number.parseInt(quantityRaw, 10);
  const quantityMaybe = Number.isInteger(quantity) ? { quantity } : {};
  const seats = Number.parseInt(seatsRaw, 10);
  const seatsMaybe = Number.isInteger(seats) ? { seats } : {};
  const deliveryMethodMaybe = deliveryMethod ? { deliveryMethod } : {};

  const initialValues = {
    listing,
    orderData: {
      ...bookingMaybe,
      ...priceVariantNameMaybe,
      ...quantityMaybe,
      ...seatsMaybe,
      ...deliveryMethodMaybe,
      ...otherOrderData,
    },
    confirmPaymentError: null,
  };

  const saveToSessionStorage = !currentUser;

  // Customize checkout page state with current listing and selected orderData
  const { setInitialValues } = findRouteByRouteName('CheckoutPage', routes);

  callSetInitialValues(setInitialValues, initialValues, saveToSessionStorage);

  // Clear previous Stripe errors from store if there is any
  onInitializeCardPaymentData();

  // Redirect to CheckoutPage
  history.push(
    createResourceLocatorString(
      'CheckoutPage',
      routes,
      { id: listing.id.uuid, slug: createSlug(listing.attributes.title) },
      {}
    )
  );
};

/**
 * Wet District manual booking request handler.
 *
 * ONLY intercepts listings using the default-booking process (isBooking === true).
 * All other processes (purchase, inquiry) fall through to the original handleSubmit
 * checkout path unchanged.
 *
 * Does NOT call initiatePrivileged, does NOT touch Stripe, does NOT create a
 * Sharetribe transaction.
 *
 * @param {Object} parameters - same shape as handleSubmit parameters, plus:
 *   @param {boolean} parameters.isBooking - from isBookingProcess(processName)
 *   @param {Function} parameters.onRequestSent - setState callback to show confirmation
 *   @param {Function} parameters.onRequestError - setState callback to show error
 *   @param {Array}   parameters.lineItems - current price breakdown from Redux
 */
export const handleBookingRequest = parameters => values => {
  const {
    isBooking,
    onRequestSent,
    onRequestError,
    lineItems,
    // original handleSubmit params kept for fallback
    history,
    params,
    currentUser,
    getListing,
    callSetInitialValues,
    onInitializeCardPaymentData,
    routes,
  } = parameters;

  // ── Fallback: not a booking listing → use original checkout path unchanged ──
  if (!isBooking) {
    return handleSubmit({
      history,
      params,
      currentUser,
      getListing,
      callSetInitialValues,
      onInitializeCardPaymentData,
      routes,
    })(values);
  }

  // ── Booking listing: send manual request, no Stripe ──
  const listingId = new UUID(params.id);
  const listing = getListing(listingId);
  const { title = '', publicData = {} } = listing?.attributes || {};
  const { priceVariants = [] } = publicData;

  const {
    bookingStartTime,
    bookingEndTime,
    priceVariantName,
    seats: seatsRaw,
    customerPhone,
  } = values;

  const startDate = bookingStartTime ? timestampToDate(bookingStartTime) : null;
  const endDate = bookingEndTime ? timestampToDate(bookingEndTime) : null;
  const seats = Number.parseInt(seatsRaw, 10);

  // Resolve estimated total from lineItems if available
  const customerTotal = lineItems
    ? lineItems.reduce((sum, li) => {
        const amount = li.lineTotal?.amount || 0;
        return li.includeFor?.includes('customer') ? sum + amount : sum;
      }, 0)
    : null;
  const estimatedTotal = customerTotal != null
    ? `$${(customerTotal / 100).toFixed(2)}`
    : null;

  // Resolve selected variant price label
  const selectedVariant = priceVariants.find(v => v.name === priceVariantName);
  const variantLabel = selectedVariant
    ? `${selectedVariant.name} — $${(selectedVariant.priceInSubunits / 100).toFixed(2)}`
    : priceVariantName || null;

  // Customer info — phone comes from the form field (source of truth)
  const profile = currentUser?.attributes?.profile || {};
  const customerName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null;
  const customerEmail = currentUser?.attributes?.email || null;
  // Fallback to profile protectedData/privateData if form field is somehow empty
  const resolvedPhone =
    customerPhone ||
    profile.protectedData?.phoneNumber ||
    profile.privateData?.phoneNumber ||
    profile.publicData?.phoneNumber ||
    null;

  const payload = {
    listingId: listing?.id?.uuid,
    listingTitle: title,
    listingUrl: typeof window !== 'undefined' ? window.location.href : null,
    selectedDate: startDate ? startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : null,
    startTime: startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    endTime: endDate ? endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
    duration: startDate && endDate ? `${Math.round((endDate - startDate) / 60000)} minutes` : null,
    priceVariantName: variantLabel,
    estimatedTotal,
    seats: Number.isInteger(seats) ? seats : null,
    customerName,
    customerEmail,
    customerPhone: resolvedPhone,
    submittedAt: new Date().toISOString(),
  };

  fetch('/api/booking-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(res => {
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      return res.json();
    })
    .then(() => {
      if (onRequestSent) onRequestSent();
    })
    .catch(err => {
      console.error('Booking request failed:', err);
      if (onRequestError) onRequestError(err);
    });
};

/**
 * Create fallback views for the ListingPage: LoadingPage and ErrorPage.
 * The PlainPage is just a helper for them.
 */
const PlainPage = props => {
  const { title, topbar, scrollingDisabled, children } = props;
  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={topbar} footer={<FooterContainer />}>
        {children}
      </LayoutSingleColumn>
    </Page>
  );
};

export const ErrorPage = props => {
  const { topbar, scrollingDisabled, invalidListing, intl } = props;
  return (
    <PlainPage
      title={intl.formatMessage({
        id: 'ListingPage.errorLoadingListingTitle',
      })}
      topbar={topbar}
      scrollingDisabled={scrollingDisabled}
    >
      <p className={css.errorText}>
        {invalidListing ? (
          <FormattedMessage id="ListingPage.errorInvalidListingMessage" />
        ) : (
          <FormattedMessage id="ListingPage.errorLoadingListingMessage" />
        )}
      </p>
    </PlainPage>
  );
};

export const LoadingPage = props => {
  const { topbar, scrollingDisabled, intl } = props;
  return (
    <PlainPage
      title={intl.formatMessage({
        id: 'ListingPage.loadingListingTitle',
      })}
      topbar={topbar}
      scrollingDisabled={scrollingDisabled}
    >
      <p className={css.loadingText}>
        <FormattedMessage id="ListingPage.loadingListingMessage" />
      </p>
    </PlainPage>
  );
};
