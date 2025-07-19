import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { cartItems } = await req.json()

    console.log("CartItems received in Edge Function:", JSON.stringify(cartItems, null, 2));

    if (!cartItems || !Array.isArray(cartItems)) {
      throw new Error('Missing or invalid "cartItems" in request body.')
    }


    // Use a transaction to ensure all stock updates succeed or none do
    const updates = cartItems.map(item => {
      console.log('⏳ Calling decrement_stock for product:', item.product_id, 'Qty:', item.quantity);
      return supabaseAdmin.rpc('decrement_stock', {
        product_id_to_update: item.product_id,
        quantity_to_decrement: item.quantity,
        store_id_input: 'S001'
      });
    });



    // We don't have a true transaction here, but we can run them in parallel
    await Promise.all(updates)

    return new Response(JSON.stringify({ message: 'Stock updated successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})