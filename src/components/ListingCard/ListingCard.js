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
  const { Money } = sdkTypes;
  
  const formatHourly = cents => {
    if (!cents) return null;
    const hourlyAmount = Math.round(cents / 3);
    const money = new Money(hourlyAmount, currency);
    return formatMoney(intl, money).replace(/\.\d{2}/, '');
  };
  
  if (publicData?.priceVariants && publicData.priceVariants.length > 0) {
    const variants = publicData.priceVariants.map(variant => {
      const sessionPrice = variant.price?.amount || variant.priceInSubunits;
      const hourlyPrice = Math.round(sessionPrice / 300);
      return {
        name: variant.name,
        price: '$' + hourlyPrice
      };
    }).filter(v => v.name && v.price);
    
    if (variants.length > 0) {
      return {
        variants,
        hasVariants: true
      };
    }
  }
  
  if (price && price.currency === currency) {
    const baseAmount = price.amount;
    const weekdayAmount = Math.round(baseAmount * 0.9);
    const weekdayPrice = formatHourly(weekdayAmount);
    const weekendPrice = formatHourly(baseAmount);
    
    return {
      variants: [
        { name: 'Weekday', price: weekdayPrice },
        { name: 'Weekend', price: weekendPrice }
      ],
      hasVariants: true
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
      hasVariants: false
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

  const { formattedPrice, priceTitle, hasVariants, variants } = priceData(price, publicData, config.currency, intl);

  return (
    <div className={css.price}>
      {hasVariants && variants?.length > 0 ? (
        variants.map((variant, index) => (
          <div key={`variant-${index}`} className={css.priceValue} title={`${variant.name}: ${variant.price}`}>
            <span className={css.priceNumber}>{variant.price}</span>
            <span className={css.priceLabel}>/hr</span>
            {variant.name && <span className={css.priceLabel}> · {variant.name}</span>}
          </div>
        ))
      ) : (
        <div className={css.priceValue} title={priceTitle}>
          <span className={css.priceNumber}>{formattedPrice}</span>
          <span className={css.priceLabel}> /hr</span>
        </div>
      )}
    </div>
  );
};

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
  
  title = title.replace(/"/g, "'");

  const slug = createSlug(title);
  const author = ensureUser(listing.author);
  const firstImage = currentListing.images && currentListing.images.length > 0 ? currentListing.images[0] : null;

  const {
    aspectWidth = 1,
    aspectHeight = 1,
    variantPrefix = 'listing-card',
  } = config.layout.listingImage;
  
  const variants = firstImage?.attributes?.variants
    ? Object.keys(firstImage.attributes.variants || {}).filter(k => k.startsWith(variantPrefix))
    : [];

  const setActivePropsMaybe = setActiveListing
    ? {
        onMouseEnter: () => setActiveListing(currentListing.id),
        onMouseLeave: () => setActiveListing(null),
      }
    : null;

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
          <div className={css.titleRow}>
            <div className={css.title}>
              {richText(title, {
                longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
                longWordClass: css.longWord,
              })}
            </div>
            <div className={css.guests}>
              {(() => {
                try {
                  let guestCount = null;
                  
                  if (publicData && publicData.guests != null) {
                    const num = Number(publicData.guests);
                    if (!isNaN(num) && num > 0) guestCount = num;
                  }
                  else if (publicData && publicData.capacity != null) {
                    const num = Number(publicData.capacity);
                    if (!isNaN(num) && num > 0) guestCount = num;
                  }
                  else if (publicData && publicData.attributes && publicData.attributes.guests != null) {
                    const num = Number(publicData.attributes.guests);
                    if (!isNaN(num) && num > 0) guestCount = num;
                  }
                  else if (publicData && publicData.attributes && publicData.attributes.capacity != null) {
                    const num = Number(publicData.attributes.capacity);
                    if (!isNaN(num) && num > 0) guestCount = num;
                  }
                  
                  const count = guestCount !== null ? guestCount : 2;
                  return `${count} guests`;
                } catch (error) {
                  console.error('Error in guest display:', error);
                  return '2 guests';
                }
              })()}
            </div>
          </div>
          <PriceMaybe price={price} publicData={publicData} config={config} intl={intl} />
        </div>
      </div>
    </NamedLink>
  );
};

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
