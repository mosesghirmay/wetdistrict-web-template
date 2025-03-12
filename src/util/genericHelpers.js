/**
 * Checks if an array is valid (not null, undefined, or empty).
 * @param {array} arr - The array to check.
 * @returns {boolean} True if the array is valid, false otherwise.
 */
export const isArrayLength = arr => {
  // Check if the input parameter is an array and has a length greater than zero.
  return Array.isArray(arr) && (arr.length > 0 ?? false);
};

// Return captilized string
export const capitalizeFirstLetter = str => {
  if (typeof str !== 'string') {
    return '';
  }
  const string = str && str.toString();
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : null;
};

//This is a sharetribe response import with data.data
export const getPublicDataAttributeValue = (attributeName, data) => {
  if (data && data.attributes && data.attributes.publicData) {
    const publicData = data.attributes.publicData;
    if (publicData.hasOwnProperty(attributeName)) {
      return publicData[attributeName];
    }
  }
  return '';
};

export const getProductImages = images => {
  if (!Array.isArray(images)) {
    return [];
  }
  return images
    .map(
      item =>
        item?.attributes?.variants &&
        (item?.attributes?.variants['scaled-medium']?.url ||
          item?.attributes?.variants['listing-card-2x']?.url)
    )
    .filter(Boolean);
};

/**
 * Returns an array of wishlist items associated with a user's profile.
 * @param {object} currentUser - The user object.
 * @returns {array} An array of wishlist items, or an empty array if input is invalid or wishlist is missing.
 */
export const getWishlist = currentUser => {
  return (
    (currentUser && currentUser.id && currentUser?.attributes?.profile?.publicData?.wishlist) || []
  );
};

export const copyToClipboard = async text => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus({
      preventScroll: true,
    });
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  } catch (e) {
    console.error(`Copying failed with error: ${e}`);
    throw e;
  }
};

export const appendAverageReviews = reviews => {
  const MIN_RATING = 1;
  const MAX_RATING = 5;

  const filteredReviews =
    Array.isArray(reviews) &&
    reviews.filter(r => r?.attributes?.rating !== null && r?.attributes?.state === 'public');

  const totalReviews = filteredReviews?.length || 0;

  if (!totalReviews) {
    return 0.0;
  }

  const ratings = filteredReviews.map(review => review?.attributes?.rating);
  const validRatings = ratings.filter(r => r >= MIN_RATING && r <= MAX_RATING);

  if (!validRatings.length) {
    return 0.0;
  }

  const starSum = validRatings.reduce((partialSum, rating) => partialSum + rating, 0);
  const averageRating = starSum / validRatings.length;

  return averageRating || 0;
};

/**
 * Parses a title string to extract and convert information into an object containing the length, make, and model.
 * The function is designed to process a specific string format where the first part is the length with a potential non-numeric character (e.g., inches symbol),
 * followed by the make and model, each separated by spaces. The length and model are converted to integers, while non-digit characters are removed from the length.
 *
 * If the input is not a string, the function returns an object with empty strings for length, make, and model to indicate an error or invalid input gracefully.
 *
 * @param {string} title The title string to be parsed, expected in the format "length make model".
 * @returns {Object} An object with `length`, `make`, and `model` keys. Length and model are returned as integers, and make as a string. If the input is invalid, returns an object with empty string values for each key.
 */
export const titleToAbbr = title => {
  if (typeof title !== 'string') {
    return {
      length: '',
      make: '',
      model: '',
    };
  }

  const words = title.split(' ');

  // This regex matches any character that's not a digit and replaces it with an empty string
  const length = words[0].replace(/[^\d]/g, '');
  const make = words[1];
  const model = words[2];

  return {
    length: parseInt(length, 10),
    make,
    model: parseInt(model, 10),
  };
};

/**
 * Converts an object with `length` and `make` properties into a formatted listing title string.
 * The function constructs a string that combines these properties, ensuring the `make` is trimmed of any leading or trailing whitespace,
 * and appends an inch symbol (") directly after the `length` value for display purposes.
 * Note: The `model` property is intentionally omitted from the title as per design requirements.
 *
 * @param {Object} param0 An object containing the keys: `length`, `make`, and `model` (though model is not used).
 * @param {number} param0.length The length of the item, expected to be a number.
 * @param {string} param0.make The make of the item, expected to be a string. The function trims this value.
 * @param {number} param0.model The model year of the item (not used in the title).
 * @returns {string} A formatted string representing the listing title, e.g., "22" Test".
 */
export const abbrToTitle = ({ length, make, model }) => {
  return `${length}" ${make?.trim()}`;
};
