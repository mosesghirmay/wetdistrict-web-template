const { transactionLineItems } = require('../api-util/lineItems');
const { getSdk, handleError, serialize, fetchCommission } = require('../api-util/sdk');
const { constructValidLineItems } = require('../api-util/lineItemHelpers');

module.exports = async (req, res) => {
  try {
    const { isOwnListing, listingId, orderData } = req.body;

    const sdk = getSdk(req, res);

    const listingPromise = () =>
      isOwnListing ? sdk.ownListings.show({ id: listingId }) : sdk.listings.show({ id: listingId });

    const [showListingResponse, fetchAssetsResponse] = await Promise.all([listingPromise(), fetchCommission(sdk)]);
    
    const listing = showListingResponse.data.data;
    const commissionAsset = fetchAssetsResponse.data.data[0];

    const { providerCommission, customerCommission } =
      commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

    const lineItems = transactionLineItems(
      listing,
      orderData,
      providerCommission,
      customerCommission
    );

    // Because we are using returned lineItems directly in this template we need to use the helper function
    // to add some attributes like lineTotal and reversal that Marketplace API also adds to the response.
    const validLineItems = constructValidLineItems(lineItems);

    if (!res.headersSent) {
      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(serialize({ data: validLineItems }))
        .end();
    }
  } catch (error) {
    console.error('transaction-line-items error:', error);
    if (!res.headersSent) {
      return handleError(res, error);
    } else {
      console.warn('Headers already sent — skipping handleError.');
    }
  }
};
