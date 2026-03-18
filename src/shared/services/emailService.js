const configLoader = require('../../core/config');
const nodemailer = require('nodemailer');
const SMTP_SERVER_DETAILS = configLoader.get('serverConfig').SMTP_SERVER_DETAILS
// Create a transporter object
const transporter = nodemailer.createTransport({
    host: SMTP_SERVER_DETAILS.SERVER,
    port: SMTP_SERVER_DETAILS.PORT,
    secure: false, // You can use another service like 'SendGrid', 'Mailgun', etc.
    auth: {
        user: SMTP_SERVER_DETAILS.MAIL_ID, // Your email
        pass: SMTP_SERVER_DETAILS.PASSWORD // Your email password (use environment variables for security)
    }
});
// Verify the connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.log(SMTP_SERVER_DETAILS);
        
        console.log('❌ Error with email configuration:', error); // Error icon
    } else {
        console.log('✅ Email service is ready to send messages'); // Success icon
    }
});


/**
 * @function sendMail
 * @description Sends an email with plain text or HTML content, including support for multiple recipients and attachments.
 * @author SURYANARAYAN BISWAL
 * 
 * @param {Object} mailOptions - The email configuration options.
 * @param {string|string[]} mailOptions.to - The recipient(s) email address. Can be a single email or an array of emails.
 * @param {string} mailOptions.subject - The subject of the email.
 * @param {string} [mailOptions.text] - The plain text content of the email (optional if HTML is provided).
 * @param {string} [mailOptions.html] - The HTML content of the email (optional if plain text is provided).
 * @param {Array<Object>} [mailOptions.attachments] - An optional array of attachment objects, where each object can have `filename` and `path` properties for attachments.
 * 
 * @returns {Promise<void>} - A promise that resolves when the email is sent successfully or rejects with an error if sending fails.
 * 
 * @example
 * // Sending a plain text email
 * sendMail({
 *   to: ['recipient1@example.com', 'recipient2@example.com'],
 *   subject: 'Hello, World!',
 *   text: 'This is a test email sent to multiple recipients.'
 * });
 * 
 * @example
 * // Sending an HTML email with attachments
 * sendMail({
 *   to: 'recipient@example.com',
 *   subject: 'Hello, World!',
 *   html: '<h1>Hello, World!</h1>',
 *   attachments: [
 *     { filename: 'file.txt', path: '/path/to/file.txt' },
 *     { filename: 'image.png', path: '/path/to/image.png', cid: 'image_cid' } // Inline image
 *   ]
 * });
 */
const sendMail = async (mailOptions) => {
    console.log("===CALLING SEND MAIL===");

    // Construct the 'from' address dynamically with a custom name and email ID
    const from = "Maddison Foo Koch 👻" + `<${SMTP_SERVER_DETAILS.MAIL_ID}>`;

    // Merge the 'from' address with the other mail options
    const completeMailOptions = {
        from: from, 
        ...mailOptions
    };

    // Log the mail options for debugging
    console.log("mailOptions", completeMailOptions);

    try {
        // Attempt to send the email using the transporter
        let info = await transporter.sendMail(completeMailOptions);
        console.log('✅ Email sent successfully:', info.response); // Success icon
    } catch (error) {
        // Catch and log any errors that occur during email sending
        console.error('❌ Error sending email:', error); // Error icon
    }
};


module.exports = {
    sendMail
}
