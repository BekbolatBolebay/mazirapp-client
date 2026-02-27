# Məzir APP - Food Delivery Application

A full-stack food delivery application built with Next.js 16, Supabase, and Cloudflare R2.

## Features

- **Bilingual Support**: English and Russian (Kazakh) interface
- **Dark/Light Theme**: Fully themed with automatic system detection
- **Real-time Updates**: Live order tracking and cart synchronization
- **Authentication**: Secure user authentication with Supabase
- **Restaurant Browsing**: Browse restaurants by category and rating
- **Menu Management**: View detailed menus with categories
- **Cart System**: Add items, manage quantities, apply promo codes
- **Order Tracking**: Real-time order status updates with detailed tracking
- **Favorites**: Save your favorite restaurants
- **Responsive Design**: Mobile-first design that adapts to all devices
- **Media Storage**: Cloudflare R2 for efficient media file storage

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Cloudflare R2
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix UI
- **State Management**: React Context + SWR patterns
- **Real-time**: Supabase Realtime
- **Internationalization**: Custom i18n context

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Cloudflare R2 account (for media storage)

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=your_r2_public_url
```

### Installation

```bash
# Install dependencies
pnpm install

# Run database migrations
# Execute the SQL scripts in /scripts folder in Supabase SQL Editor:
# 1. scripts/001-setup-database.sql
# 2. scripts/002-seed-data.sql

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main tables:

- `users` - User profiles
- `restaurants` - Restaurant information
- `menu_items` - Restaurant menu items
- `orders` - Customer orders
- `order_items` - Order line items
- `cart_items` - Shopping cart
- `favorites` - User favorite restaurants
- `promotions` - Promotional campaigns

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── cart/              # Cart page
│   ├── orders/            # Orders pages
│   ├── restaurant/        # Restaurant details
│   └── restaurants/       # Restaurant list
├── components/            # React components
│   ├── cart/              # Cart components
│   ├── home/              # Home page components
│   ├── layout/            # Layout components
│   ├── orders/            # Order components
│   ├── restaurant/        # Restaurant components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── auth/              # Authentication context
│   ├── i18n/              # Internationalization
│   ├── r2/                # Cloudflare R2 client
│   └── supabase/          # Supabase clients
└── scripts/               # Database scripts
```

## Features in Detail

### Internationalization

The app supports English and Russian (Kazakh) with easy language switching. All content is translated including:
- UI labels and buttons
- Restaurant and menu item names
- Order statuses
- Error messages

### Theme System

Custom theme implementation with:
- Light and dark mode
- Smooth transitions
- System preference detection
- Persistent user preference

### Real-time Features

- Live order status updates
- Real-time cart synchronization
- Instant notification toasts
- Automatic data refresh

### Security

- Row Level Security (RLS) policies in Supabase
- Secure authentication flow
- Protected API routes
- Environment variable management

## Deployment

The application is optimized for deployment on Vercel:

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Contributing

This is a v0-generated project. Feel free to customize and extend it for your needs.

## License

MIT
# mazirapp-client
