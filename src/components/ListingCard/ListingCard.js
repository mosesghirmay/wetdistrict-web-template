import React from 'react';
import { string, func, bool } from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { ensureListing, ensureUser } from '../../util/data';
import { richText } from '../../util/richText';
import { createSlug } from '../../util/urlHelpers';
import { isBookingProcessAlias } from '../../transactions/transaction';
import { types as sdkTypes } from '../../util/sdkLoader';

import { AspectRatioWrapper, NamedLink, ResponsiveImage } from '../../components';

import css from './ListingCard.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 10;

const priceData = (price, currency, intl) => {
  const Money = sdkTypes.Money;

  if (price && price.currency === currency) {
    // Calculate hourly price
    const hourlyAmount = Math.round(price.amount / 3); // divide session price by 3
    const hourlyPrice = new Money(hourlyAmount, price.currency);

    const formattedPrice = formatMoney(intl, hourlyPrice).replace(/\.\d{2}/, ''); // remove cents

    return {
      formattedPrice: `Starting at ${formattedPrice} per hour`,
      priceTitle: `${formattedPrice} per hour`,
    };
  } else if (price) {
    return {
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      ),
    };
  }
  return {};
};


const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

const PriceMaybe = props => {
  const { price, publicData, config, intl } = props;
  const { listingType } = publicData || {};
  const validListingTypes = config.listing.listingTypes;
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(foundListingTypeConfig);
  if (!showPrice && price) {
    return null;
  }

  const isBookable = isBookingProcessAlias(publicData?.transactionProcessAlias);
  const { formattedPrice, priceTitle } = priceData(price, config.currency, intl);

  return (
    <div className={css.price}>
      <div className={css.priceValue} title={priceTitle}>
        {formattedPrice}
      </div>
      {isBookable ? (
        <div className={css.perUnit}>
          {' '}
          <FormattedMessage id="ListingCard.perUnit" values={{ unitType: publicData?.unitType }} />
        </div>
      ) : null}
    </div>
  );
};

// Using modern default parameters to fix the warning
export const ListingCardComponent = ({
  className = null,
  rootClassName = null,
  intl,
  listing,
  renderSizes = null,
  setActiveListing = null,
  showAuthorInfo = true,
}) => {
  const config = useConfiguration();
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureListing(listing);
  const id = currentListing.id.uuid;
  let { title = '', price, publicData } = currentListing.attributes;
  
  // Replace double quotes with single quotes to signify feet
  title = title.replace(/"/g, "'");

  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const authorName = author.attributes.profile.displayName;
  // Ensure we handle images properly even if they aren't fully loaded
  const firstImage =
    currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  // Safely access variants, ensuring we don't crash if image structure isn't as expected
  const variants = firstImage?.attributes?.variants
    ? Object.keys(firstImage.attributes.variants || {}).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;
    
  // No debug logs in production code

  return (
    <NamedLink className={classes} name="ListingPage" params={{ id, slug }}>
      <AspectRatioWrapper
        className={css.aspectRatioWrapper}
        width={aspectWidth}
        height={aspectHeight}
        {...setActivePropsMaybe}
      >
        <LazyImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
          sizes={renderSizes}
        />
      </AspectRatioWrapper>
      <div className={css.info}>
        <div className={css.mainInfo}>
          <div className={css.title}>
            {richText(title, {
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
            })}
          </div>
          <div className={css.guests}>
            {/* Try to get capacity from either guests or capacity field with robust error handling */}
            {(() => {
              // Only log in development environment
              if (process.env.NODE_ENV === 'development') {
                console.log('ListingCard - publicData:', publicData);
                console.log('ListingCard - guests value:', publicData?.guests);
                console.log('ListingCard - capacity value:', publicData?.capacity);
              }
              
              // IIFE for cleaner variable scoping and multiple return statements
              if (!publicData) return '';
              
              // First try guests field with robust type checking
              if (publicData.guests != null) {
                const guestNum = Number(publicData.guests);
                if (!isNaN(guestNum) && guestNum > 0) {
                  return `${guestNum} guests`;
                }
              }
              
              // Then try capacity field with robust type checking
              if (publicData.capacity != null) {
                const capacityNum = Number(publicData.capacity);
                if (!isNaN(capacityNum) && capacityNum > 0) {
                  return `${capacityNum} guests`;
                }
              }
              
              // If we couldn't get a valid guest count, return empty string instead of a default
              return '';
            })()}
          </div>
          <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
        </div>
      </div>
    </NamedLink>
  );
};

// Removed defaultProps (replaced with default parameters above)

ListingCardComponent.propTypes = {
  className: string,
  rootClassName: string,
  intl: intlShape.isRequired,
  listing: propTypes.listing.isRequired,
  showAuthorInfo: bool,
  renderSizes: string,
  setActiveListing: func,
};

export default injectIntl(ListingCardComponent)