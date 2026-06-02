/**
 * /api/booking-request
 *
 * Receives manual booking request details from the Wet District listing page.
 * Does NOT create a Sharetribe transaction. Does NOT touch Stripe.
 *
 * Current behaviour: validates required fields, logs everything server-side
 * (visible in Render/Heroku logs), and returns { success: true }.
 *
 * To wire up email notifications later, add a provider here:
 *   - SendGrid:   npm install @sendgrid/mail  → sgMail.send(...)
 *   - Nodemailer: npm install nodemailer      → transporter.sendMail(...)
 *   - Postmark:   npm install postmark        → client.sendEmail(...)
 * Set BOOKING_REQUEST_EMAIL_TO in .env for the destination address.
 */

module.exports = (req, res) => {
  const {
    listingId,
    listingTitle,
    listingUrl,
    selectedDate,
    startTime,
    endTime,
    duration,
    priceVariantName,
    estimatedTotal,
    seats,
    customerName,
    customerEmail,
    message,
    submittedAt,
  } = req.body || {};

  // Validate the minimum required fields
  if (!listingId || !listingTitle || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: 'Missing required booking request fields: listingId, listingTitle, startTime, endTime',
    });
  }

  // Log to server stdout — appears in Render / Heroku / local terminal
  console.log('=== WET DISTRICT BOOKING REQUEST ===');
  console.log('Submitted at:   ', submittedAt || new Date().toISOString());
  console.log('Listing:        ', listingTitle, `(${listingId})`);
  console.log('URL:            ', listingUrl || 'n/a');
  console.log('Date:           ', selectedDate || 'n/a');
  console.log('Start time:     ', startTime);
  console.log('End time:       ', endTime);
  console.log('Duration:       ', duration || 'n/a');
  console.log('Rate/Variant:   ', priceVariantName || 'n/a');
  console.log('Estimated total:', estimatedTotal || 'n/a');
  console.log('Seats:          ', seats || 'n/a');
  console.log('Customer:       ', customerName || 'n/a', `<${customerEmail || 'n/a'}>`);
  console.log('Message:        ', message || '(none)');
  console.log('====================================');

  // TODO: send email here when ready, e.g.:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to: process.env.BOOKING_REQUEST_EMAIL_TO, from: 'noreply@wetdistrict.com', subject: `New booking request: ${listingTitle}`, text: ... });

  return res.status(200).json({ success: true });
};
