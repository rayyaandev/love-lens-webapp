# Email Notifications Setup

This guide will help you set up email notifications for new guest submissions using Resend.

## Prerequisites

1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key from the Resend dashboard
3. Verify your domain in Resend (or use their sandbox domain for testing)

## Environment Variables

Create a `.env.local` file in your project root and add the following variables:

```env
# Resend API Configuration
RESEND_API_KEY=your_resend_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Domain Configuration

### Option 1: Use Resend's Sandbox Domain (for testing)

Update the `from` field in `app/api/notify-submission/route.ts`:

```typescript
from: 'Love Lens <onboarding@resend.dev>',
```

### Option 2: Use Your Own Domain

1. Add your domain in the Resend dashboard
2. Verify your domain by adding the required DNS records
3. Update the `from` field in `app/api/notify-submission/route.ts`:

```typescript
from: 'Love Lens <notifications@yourdomain.com>',
```

## Features

### Email Notifications Include:

- **Guest name** (or "Anonymous" if not provided)
- **Message content**
- **Media indicator** (if photo/video was included)
- **Direct link** to view all messages
- **Beautiful HTML template** with Love Lens branding

### Notification Settings:

- **Toggle on/off** in booth settings
- **Respects user preferences** - only sends if enabled
- **Non-blocking** - submission succeeds even if email fails
- **Error handling** - logs errors but doesn't break functionality

## Testing

1. Set up your environment variables
2. Create a booth with email notifications enabled
3. Submit a test message from the guest page
4. Check your email for the notification

## Troubleshooting

### Common Issues:

1. **"Failed to send email" error**
   - Check your RESEND_API_KEY is correct
   - Verify your domain is properly configured
   - Check Resend dashboard for any errors

2. **Emails not being received**
   - Check spam folder
   - Verify the `to` email address is correct
   - Check Resend dashboard for delivery status

3. **Domain verification issues**
   - Follow Resend's domain verification guide
   - Wait for DNS propagation (can take up to 24 hours)
   - Use sandbox domain for immediate testing

## Customization

You can customize the email template by modifying the `emailContent` variable in `app/api/notify-submission/route.ts`. The template includes:

- **HTML styling** with Love Lens branding
- **Responsive design** for mobile and desktop
- **Call-to-action button** to view messages
- **Professional layout** with proper spacing and colors
