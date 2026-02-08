# Email Notifications Setup

This app sends beautiful email notifications when users favorite events.

## Setup Steps

### 1. Sign up for Resend (Email Service)

1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your domain or use their testing domain
3. Get your API key from the dashboard

### 2. Deploy the Edge Function to Supabase

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (use your project ref from dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Set environment variables
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase secrets set SITE_URL=https://your-production-url.com

# Deploy the function
supabase functions deploy send-favorite-email
```

### 3. Verify Function is Working

Test the function in your Supabase Dashboard:
1. Go to Edge Functions
2. Find `send-favorite-email`
3. Click "Invoke" and test with sample data:

```json
{
  "userId": "user-uuid",
  "eventId": "event-uuid",
  "userEmail": "test@example.com"
}
```

### 4. Testing Locally

```bash
# Start Supabase local dev
supabase start

# In another terminal, serve the function locally
supabase functions serve send-favorite-email --env-file .env.local

# Create .env.local with:
RESEND_API_KEY=your_key
SITE_URL=http://localhost:3001
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

## Email Template Features

The email includes:
- ✅ Beautiful festival branding with gradient header
- ✅ Event title, description, date/time, venue
- ✅ Category badge with matching color
- ✅ All presenter photos and bios
- ✅ Social media links for presenters
- ✅ Call-to-action button to view full schedule
- ✅ Mobile-responsive design

## Cost

- Resend: Free tier includes 100 emails/day, 3,000/month
- Supabase Edge Functions: Free tier includes 500k invocations/month

## Customization

To customize the email template, edit:
`supabase/functions/send-favorite-email/index.ts`

Then redeploy:
```bash
supabase functions deploy send-favorite-email
```

## Troubleshooting

If emails aren't sending:
1. Check Edge Function logs in Supabase Dashboard
2. Verify RESEND_API_KEY is set correctly
3. Make sure your Resend domain is verified
4. Check spam folder for test emails
