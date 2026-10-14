import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
})

export async function createSubscription(orgId: string, email: string, seatCount: number) {
  const customer = await stripe.customers.create({ email, metadata: { org_id: orgId } })

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'DevEnv Team' },
        unit_amount: 1500, // $15.00 per seat
        recurring: { interval: 'month' },
      },
      quantity: Math.max(seatCount, 3), // minimum 3 seats
    }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  })

  return subscription
}

export async function updateSeatCount(subscriptionId: string, seatCount: number) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const itemId = subscription.items.data[0].id

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, quantity: Math.max(seatCount, 3) }],
    proration_behavior: 'always_invoice',
  })
}
