import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const orgId = subscription.metadata?.org_id ?? await getOrgIdFromCustomer(subscription.customer as string)
    if (orgId) {
      await adminSupabase
        .from('organizations')
        .update({
          stripe_subscription_id: subscription.id,
          seat_count: subscription.items.data[0].quantity ?? 3,
        })
        .eq('id', orgId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const orgId = await getOrgIdFromCustomer(subscription.customer as string)
    if (orgId) {
      await adminSupabase
        .from('organizations')
        .update({ stripe_subscription_id: null })
        .eq('id', orgId)
    }
  }

  return NextResponse.json({ received: true })
}

async function getOrgIdFromCustomer(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.org_id ?? null
}
