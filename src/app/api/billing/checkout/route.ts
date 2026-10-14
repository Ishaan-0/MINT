import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_id } = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'DevEnv Team' },
        unit_amount: 1500,
        recurring: { interval: 'month' },
      },
      quantity: 3,
    }],
    subscription_data: { metadata: { org_id } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?setup=complete`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup`,
  })

  return NextResponse.json({ url: session.url })
}
