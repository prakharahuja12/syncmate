import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;

  try {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
    return transporter;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize email transporter');
    return null;
  }
};

/**
 * Sends an email notification to a user if enabled in settings and SMTP is configured.
 *
 * @param {object} params
 * @param {object} params.user
 * @param {string} params.title
 * @param {string} params.body
 * @param {object} [params.data={}]
 * @returns {Promise<'sent'|'failed'|'skipped'>}
 */
export const sendEmailToUser = async ({ user, title, body, data = {} }) => {
  try {
    if (!user || !user.email) return 'skipped';

    // Check user preferences - defaults to false per DATA_MODEL.md
    if (!user.settings || user.settings.emailNotifications !== true) {
      return 'skipped';
    }

    const mailer = getTransporter();
    if (!mailer) {
      return 'skipped';
    }

    const deepLink = data?.deepLink || (data?.eventId ? `/event/${data.eventId}` : '');
    const actionUrl = `${env.WEB_URL}${deepLink}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1a202c; margin-top: 0;">${title}</h2>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">${body}</p>
        ${
          deepLink
            ? `<div style="margin-top: 24px;">
                 <a href="${actionUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">View in SyncMate</a>
               </div>`
            : ''
        }
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 12px;" />
        <p style="color: #a0aec0; font-size: 12px; margin: 0;">You received this email because email notifications are enabled in your SyncMate account.</p>
      </div>
    `;

    const textContent = `${title}\n\n${body}${deepLink ? `\n\nView in SyncMate: ${actionUrl}` : ''}`;

    await mailer.sendMail({
      from: env.MAIL_FROM,
      to: user.email,
      subject: `[SyncMate] ${title}`,
      text: textContent,
      html: htmlContent,
    });

    return 'sent';
  } catch (err) {
    logger.error({ err, userId: user?._id }, 'Error sending email to user');
    return 'failed';
  }
};
