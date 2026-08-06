import { getStripe } from '../lib/stripe';
import { Env } from '../types';

export async function handleCreateInvoice(customerId: string, env: Env): Promise<Response> {
  try {
    const stripe = getStripe(env);

    // 1. Create a draft invoice (automatically pulls in all pending InvoiceItems for this customer)
    const draftInvoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 14, // Net 14 terms
      auto_advance: true,
    });

    // 2. Finalize the invoice (freezes items, generates official invoice number and payment link)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(draftInvoice.id);

    // 3. Send the invoice via email with payment link
    const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

    return Response.json({
      success: true,
      data: {
        id: sentInvoice.id,
        number: sentInvoice.number,
        customer_id: sentInvoice.customer,
        amount_due: sentInvoice.amount_due,
        currency: sentInvoice.currency,
        status: sentInvoice.status,
        hosted_invoice_url: sentInvoice.hosted_invoice_url,
        invoice_pdf: sentInvoice.invoice_pdf,
        due_date: sentInvoice.due_date ? new Date(sentInvoice.due_date * 1000).toISOString() : null,
      },
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}

export async function handleListInvoices(customerId: string, env: Env): Promise<Response> {
  try {
    const stripe = getStripe(env);
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    return Response.json({
      success: true,
      data: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount_due: inv.amount_due,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        hosted_invoice_url: inv.hosted_invoice_url,
        created_at: new Date(inv.created * 1000).toISOString(),
      })),
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: err.code || 'STRIPE_ERROR', message: err.message } },
      { status: err.statusCode || 500 }
    );
  }
}
