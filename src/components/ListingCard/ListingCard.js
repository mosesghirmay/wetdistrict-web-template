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

const priceData = (price, publicData, currency, intl) => {
  const Money = sdkTypes.Money;
  
  // Format price as hourly rate
  const formatHourly = cents => {
    if (!cents) return null;
    const hourlyAmount = Math.round(cents / 3); // divide session price by 3 for hourly rate
    const money = new Money(hourlyAmount, currency);
    return formatMoney(intl, money).replace(/\.\d{2}/, ''); // remove cents
  };
  
  // Check if we have price variants
  if (publicData?.priceVariants && Array.isArray(publicData.priceVariants) && publicData.priceVariants.length > 0) {
    // Map each variant to a formatted price object
    const formattedVariants = publicData.priceVariants.map(variant => {
      return {
        name: variant.name,
        formattedPrice: formatHourly(variant.price?.amount)
      };
    }).filter(v => v.formattedPrice); // Remove any invalid prices
    
    return {
      hasVariants: formattedVariants.length > 0,
      variants: formattedVariants
    };
  } 
  
  // Fallback to using the base price
  if (price && price.currency === currency) {
    const formattedPrice = formatHourly(price.amount);
    return {
      hasVariants: false,
      formattedPrice: `Starting at ${formattedPrice} per hour`,
      priceTitle: `${formattedPrice} per hour`
    };
  } else if (price) {
    return {
      hasVariants: false,
      formattedPrice: intl.formatMessage(
        { id: 'ListingCard.unsupportedPrice' },
        { currency: price.currency }
      ),
      priceTitle: intl.formatMessage(
        { id: 'ListingCard.unsupportedPriceTitle' },
        { currency: price.currency }
      )
    };
  }
  
  return { hasVariants: false };
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
  const priceInfo = priceData(price, publicData, config.currency, intl);
  const { formattedPrice, priceTitle, hasVariants, variants } = priceInfo;

  return (
    <div className={css.price}>
      {hasVariants ? (
        // Show all price variants with their names
        variants.map((variant, index) => (
          <div key={index} className={css.priceValue}>
            {variant.formattedPrice} per hour {variant.name}
          </div>
        ))
      ) : (
        // Fallback to single price display
        <div className={css.priceValue} title={priceTitle}>
          {formattedPrice}
        </div>
      )}
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
            {(() => {
              try {
                // Get capacity from either guests or capacity with multiple fallbacks
                let guestCount = null;
                
                // Method 1: Direct publicData.guests access
                if (publicData && publicData.guests != null) {
                  const num = Number(publicData.guests);
                  if (!isNaN(num) && num > 0) guestCount = num;
                }
                // Method 2: Direct publicData.capacity access
                else if (publicData && publicData.capacity != null) {
                  const num = Number(publicData.capacity);
                  if (!isNaN(num) && num > 0) guestCount = num;
                }
                // Method 3: Nested publicData.attributes.guests access
                else if (publicData && publicData.attributes && publicData.attributes.guests != null) {
                  const num = Number(publicData.attributes.guests);
                  if (!isNaN(num) && num > 0) guestCount = num;
                }
                // Method 4: Nested publicData.attributes.capacity access
                else if (publicData && publicData.attributes && publicData.attributes.capacity != null) {
                  const num = Number(publicData.attributes.capacity);
                  if (!isNaN(num) && num > 0) guestCount = num;
                }
                
                // If we have valid guest count, show it
                if (guestCount !== null) {
                  return `${guestCount} guests`;
                }
                
                // Default fallback for all environments
                return '2 guests'; // Always show default to avoid empty space
              } catch (error) {
                console.error('Error in guest display:', error);
                return '2 guests'; // Fallback in case of any error
              }
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