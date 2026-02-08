// Supabase Edge Function to send favorite notification emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  userId: string
  eventId: string
  userEmail: string
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Parse request body
    let body
    try {
      const text = await req.text()
      body = text ? JSON.parse(text) : {}
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { userId, eventId, userEmail }: EmailRequest = body

    // Validate required fields
    if (!userId || !eventId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, eventId, userEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch event details with related data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        venue:venues(*),
        event_presenters(presenter:presenters(*))
      `)
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      throw new Error('Event not found')
    }

    const presenters = event.event_presenters.map((ep: any) => ep.presenter)
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)

    // Format date and time
    const dateStr = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const timeStr = `${startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })} - ${endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })}`

    // Build presenter section HTML
    const presenterHTML = presenters.map((p: any) => `
      <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 16px;">
        ${p.image ? `
          <img src="${p.image}" alt="${p.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px;">
        ` : ''}
        <h3 style="margin: 10px 0; color: #0f172a; font-size: 20px; font-weight: 700;">${p.name}</h3>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 10px 0;">${p.bio}</p>
        ${p.instagram || p.website ? `
          <div style="margin-top: 12px;">
            ${p.instagram ? `<a href="https://instagram.com/${p.instagram}" style="color: #ea580c; text-decoration: none; margin-right: 15px; font-size: 13px; font-weight: 600;">Instagram</a>` : ''}
            ${p.website ? `<a href="${p.website}" style="color: #ea580c; text-decoration: none; font-size: 13px; font-weight: 600;">Website</a>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('')

    // Create HTML email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">🪷 Bali Spirit Festival</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Saved to Your Favorites</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Great choice! You've added this session to your favorites. Here's everything you need to know:
            </p>

            <!-- Event Card -->
            <div style="border-left: 4px solid ${event.category?.color || '#ea580c'}; padding: 25px; background: #fef3f2; border-radius: 16px; margin-bottom: 30px;">
              <div style="display: inline-block; background: ${event.category?.color || '#ea580c'}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">
                ${event.category?.name || 'Session'}
              </div>

              <h2 style="color: #0f172a; margin: 15px 0; font-size: 28px; font-weight: 800; line-height: 1.2;">
                ${event.title}
              </h2>

              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 12px;">
                <p style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                  📅 ${dateStr}
                </p>
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 15px; font-weight: 600;">
                  🕐 ${timeStr}
                </p>
                <p style="margin: 0; color: #64748b; font-size: 15px; font-weight: 600;">
                  📍 ${event.venue?.name || 'Venue TBA'}
                </p>
              </div>

              <p style="color: #334155; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                ${event.description}
              </p>
            </div>

            <!-- Presenters -->
            ${presenters.length > 0 ? `
              <h3 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
                Your Teachers & Facilitators
              </h3>
              ${presenterHTML}
            ` : ''}

            <!-- CTA -->
            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'http://localhost:3001'}"
                 style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
                View Your Full Schedule
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
              You're receiving this because you favorited a session at Bali Spirit Festival.<br>
              Manage your favorites anytime in the app.
            </p>
            <p style="color: #cbd5e1; font-size: 12px; margin: 15px 0 0 0;">
              © 2026 Bali Spirit Festival
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Bali Spirit Festival <onboarding@resend.dev>', // Use resend.dev for testing
        to: userEmail,
        subject: `❤️ You favorited: ${event.title}`,
        html
      })
    })

    if (!emailRes.ok) {
      const error = await emailRes.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const result = await emailRes.json()

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
