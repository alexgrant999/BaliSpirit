#!/bin/bash

# Email Function Deployment Script for Bali Spirit Festival
# This deploys the email notification Edge Function to Supabase

echo "🪷 Bali Spirit Festival - Email Function Deployment"
echo "=================================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo ""
    echo "Please install it first:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "Or download from: https://github.com/supabase/cli"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Project details
PROJECT_REF="isvjtaxpxgmgdcbdqktz"
RESEND_API_KEY="re_7U4EcGJ8_9ePzeZWDHu46w43K6LbrG97Y"
SITE_URL="http://localhost:3001"

echo "📋 Configuration:"
echo "  Project: $PROJECT_REF"
echo "  Site URL: $SITE_URL"
echo ""

# Link project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Failed to link project. Please run 'supabase login' first."
    exit 1
fi

echo "✅ Project linked"
echo ""

# Set secrets
echo "🔐 Setting environment variables..."
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"
supabase secrets set SITE_URL="$SITE_URL"

echo "✅ Secrets configured"
echo ""

# Deploy function
echo "🚀 Deploying send-favorite-email function..."
supabase functions deploy send-favorite-email

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📧 Your email notifications are now live!"
    echo ""
    echo "To test:"
    echo "  1. Heart an event in the app"
    echo "  2. Check your email inbox"
    echo ""
    echo "View logs: https://supabase.com/dashboard/project/$PROJECT_REF/functions/send-favorite-email/logs"
else
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi
