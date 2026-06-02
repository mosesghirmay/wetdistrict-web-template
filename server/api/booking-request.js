/**
 * /api/booking-request
 *
 * Receives manual booking request details from the Wet District listing page.
 * Does NOT create a Sharetribe transaction. Does NOT touch Stripe.
 *
 * Behaviour:
 *  1. Validates required fields.
 *  2. Logs all fields to server stdout (visible in Render / Heroku / local terminal).
 *  3. Sends a notification email via Resend (only if RESEND_API_KEY is set).
 *  4. Returns { success: true } regardless of email delivery status so the
 *     customer always sees the confirmation message.
 *
 * Required environment variables for email:
 *   RESEND_API_KEY            — from resend.com dashboard
 *   BOOKING_REQUEST_EMAIL_TO  — recipient address, e.g. mosesghirmay@gmail.com
 *
 * Optional environment variables:
 *   BOOKING_REQUEST_EMAIL_FROM — sender address (must be a verified Resend domain
 *                                in production; defaults to onboarding@resend.dev
 *                                for local/staging testing)
 */

const { Resend } = require('resend');

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
    customerPhone,
    message,
    submittedAt,
  } = req.body || {};

  // ── Validate required fields ──────────────────────────────────────────────
  if (!listingId || !listingTitle || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: 'Missing required booking request fields: listingId, listingTitle, startTime, endTime',
    });
  }

  // ── Server log ────────────────────────────────────────────────────────────
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
  console.log('Phone:          ', customerPhone || 'n/a');
  console.log('Message:        ', message || '(none)');
  console.log('====================================');

  // ── Email via Resend (fire-and-forget — never blocks the 200 response) ───
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailTo = process.env.BOOKING_REQUEST_EMAIL_TO;

  if (resendApiKey && emailTo) {
    const resend = new Resend(resendApiKey);
    const emailFrom =
      process.env.BOOKING_REQUEST_EMAIL_FROM || 'onboarding@resend.dev';

    const subject = `New Wet District Booking Request — ${listingTitle}`;

    const textBody = [
      `NEW BOOKING REQUEST — WET DISTRICT`,
      `Submitted: ${submittedAt || new Date().toISOString()}`,
      ``,
      `── LISTING ─────────────────────────────`,
      `Title:          ${listingTitle}`,
      `Listing ID:     ${listingId}`,
      `URL:            ${listingUrl || 'n/a'}`,
      ``,
      `── DATE & TIME ──────────────────────────`,
      `Date:           ${selectedDate || 'n/a'}`,
      `Start time:     ${startTime}`,
      `End time:       ${endTime}`,
      `Duration:       ${duration || 'n/a'}`,
      ``,
      `── PRICING ──────────────────────────────`,
      `Rate/Variant:   ${priceVariantName || 'n/a'}`,
      `Estimated total:${estimatedTotal || 'n/a'}`,
      `Guest count:    ${seats != null ? seats : 'n/a'}`,
      ``,
      `── CUSTOMER ─────────────────────────────`,
      `Name:           ${customerName || 'n/a'}`,
      `Email:          ${customerEmail || 'n/a'}`,
      `Phone:          ${customerPhone || 'n/a'}`,
      ``,
      `── MESSAGE ──────────────────────────────`,
      message || '(no message)',
      ``,
      `─────────────────────────────────────────`,
      `Reply directly to this email to contact the customer.`,
    ].join('\n');

    const htmlBody = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
  <h2 style="background:#111;color:#fff;padding:16px 20px;margin:0">
    New Booking Request — Wet District
  </h2>
  <div style="padding:20px">

    <h3 style="margin-top:0">Listing</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#555;width:140px">Title</td><td><strong>${listingTitle}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#555">Listing ID</td><td>${listingId}</td></tr>
      ${listingUrl ? `<tr><td style="padding:4px 0;color:#555">URL</td><td><a href="${listingUrl}">${listingUrl}</a></td></tr>` : ''}
    </table>

    <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
    <h3>Date &amp; Time</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#555;width:140px">Date</td><td>${selectedDate || 'n/a'}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Start time</td><td>${startTime}</td></tr>
      <tr><td style="padding:4px 0;color:#555">End time</td><td>${endTime}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Duration</td><td>${duration || 'n/a'}</td></tr>
    </table>

    <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
    <h3>Pricing</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#555;width:140px">Rate / Variant</td><td>${priceVariantName || 'n/a'}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Estimated total</td><td><strong>${estimatedTotal || 'n/a'}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#555">Guest count</td><td>${seats != null ? seats : 'n/a'}</td></tr>
    </table>

    <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
    <h3>Customer</h3>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:4px 0;color:#555;width:140px">Name</td><td>${customerName || 'n/a'}</td></tr>
      <tr><td style="padding:4px 0;color:#555">Email</td><td><a href="mailto:${customerEmail}">${customerEmail || 'n/a'}</a></td></tr>
      <tr><td style="padding:4px 0;color:#555">Phone</td><td>${customerPhone || 'n/a'}</td></tr>
    </table>

    ${message ? `
    <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
    <h3>Message from customer</h3>
    <p style="background:#f9f9f9;padding:12px;border-radius:4px;margin:0">${message}</p>
    ` : ''}

    <hr style="margin:16px 0;border:none;border-top:1px solid #eee">
    <p style="color:#888;font-size:12px">
      Submitted ${submittedAt || new Date().toISOString()}<br>
      Reply directly to this email to contact the customer.
    </p>
  </div>
</div>`;

    resend.emails
      .send({
        from: emailFrom,
        to: emailTo,
        reply_to: customerEmail || undefined,
        subject,
        text: textBody,
        html: htmlBody,
      })
      .then(() => {
        console.log(`📧 Booking request email sent to ${emailTo}`);
      })
      .catch(err => {
        console.error('⚠️  Booking request email failed (request still recorded):', err?.message || err);
      });
  } else {
    console.warn('⚠️  RESEND_API_KEY or BOOKING_REQUEST_EMAIL_TO not set — email skipped');
  }

  // Always return success so the customer sees the confirmation message
  return res.status(200).json({ success: true });
};
