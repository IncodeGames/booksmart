interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InvoiceEmailData {
  invoiceId: number;
  clientName: string;
  clientEmail: string;
  amount: number;
  dueDate: string;
  issuedDate: string;
  customMessage?: string;
  invoiceNumber?: string;
}

export class EmailService {
  private static readonly SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send';
  private static readonly API_KEY = import.meta.env.VITE_SMTP2GO_API_KEY;

  static async sendInvoice(invoiceData: InvoiceEmailData): Promise<boolean> {
    if (!this.API_KEY) {
      throw new Error('SMTP2GO API key not configured');
    }

    const emailHtml = this.generateInvoiceHTML(invoiceData);
    const emailText = this.generateInvoiceText(invoiceData);

    const emailData: EmailData = {
      to: invoiceData.clientEmail,
      subject: `Invoice #${invoiceData.invoiceId} from Your Company`,
      html: emailHtml,
      text: emailText
    };

    return this.sendEmail(emailData);
  }

  private static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const response = await fetch(this.SMTP2GO_API_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.API_KEY,
          to: [emailData.to],
          sender: import.meta.env.VITE_FROM_EMAIL || 'noreply@yourcompany.com',
          subject: emailData.subject,
          html_body: emailData.html,
          text_body: emailData.text || this.stripHtml(emailData.html)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('SMTP2GO API Error:', result);
        throw new Error(result.data?.error || 'Failed to send email');
      }

      return result.data?.succeeded > 0;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  private static generateInvoiceHTML(data: InvoiceEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${data.invoiceId}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .invoice-title { color: #2c3e50; margin: 0; font-size: 28px; }
          .invoice-number { color: #7f8c8d; font-size: 16px; margin: 5px 0 0 0; }
          .details { background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f1f3f4; }
          .detail-row:last-child { border-bottom: none; margin-bottom: 0; }
          .detail-label { font-weight: bold; color: #495057; }
          .detail-value { color: #212529; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .message { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="invoice-title">Invoice</h1>
          <p class="invoice-number">#${data.invoiceId}</p>
        </div>

        <div class="details">
          <div class="detail-row">
            <span class="detail-label">Client:</span>
            <span class="detail-value">${data.clientName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">$${data.amount.toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Issued Date:</span>
            <span class="detail-value">${new Date(data.issuedDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${new Date(data.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        ${data.customMessage ? `
          <div class="message">
            <h3>Message:</h3>
            <p>${data.customMessage}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Please remit payment by the due date specified above.</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateInvoiceText(data: InvoiceEmailData): string {
    return `
INVOICE #${data.invoiceId}

Client: ${data.clientName}
Amount: $${data.amount.toFixed(2)}
Issued Date: ${new Date(data.issuedDate).toLocaleDateString()}
Due Date: ${new Date(data.dueDate).toLocaleDateString()}

${data.customMessage ? `Message:\n${data.customMessage}\n\n` : ''}

Thank you for your business!
Please remit payment by the due date specified above.
    `.trim();
  }

  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}