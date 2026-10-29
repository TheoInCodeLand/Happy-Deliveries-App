# HappyDeliveries

**A food delivery app that connects hungry customers, restaurant owners, and delivery drivers — all in one place.**

HappyDeliveries lets customers browse nearby restaurants and order food, restaurant managers publish and manage their menus, and drivers pick up and deliver orders in real time. Think of it as a complete Uber Eats-style platform you can run yourself.

---

## What Can It Do?

### For Customers
- **Find restaurants near you** — search by name, cuisine, or distance
- **Build your order** — add items to your cart, customize, and check out
- **Track your delivery live** — see your driver's location in real time on a map
- **Get notified** — push notifications keep you updated at every step

### For Restaurant Managers
- **Manage your restaurants** — add, edit, or remove your restaurant listings
- **Create and update menus** — add items with photos, prices, categories, and dietary info
- **View your dashboard** — see revenue, order history, top-selling items, and ratings
- **Control the flow** — accept incoming orders and publish them to nearby drivers

### For Drivers
- **See available deliveries** — get notified of new orders near you
- **Track your earnings** — view how much you've made per delivery and over time
- **Update your status** — go online/offline, update your vehicle info
- **Verify deliveries** — confirm drop-off with a unique delivery code (QR scan supported)

### Behind the Scenes
- Secure login and registration for all three roles
- Real-time updates powered by WebSockets (no page refreshing needed)
- Location-based search — finds restaurants within your area automatically
- Payment gateway support (Stripe, Paystack, Flutterwave)
- A web-based dashboard for restaurant managers (accessible from any browser)

---

## How It's Built

The project has two main parts:

| Part | What it is | Key technologies |
|------|-----------|-----------------|
| **Backend** (server) | The engine that handles all the data, user accounts, orders, and payments | Node.js, Express, PostgreSQL, Socket.io |
| **Mobile App** | The app customers and drivers use on their phones | React Native, Expo, TypeScript |

The backend also includes a **web dashboard** for restaurant managers, so they can manage everything from a browser.

---

## What You'll Need Before Starting

Before you can run HappyDeliveries, make sure you have these installed on your computer:

1. **Node.js** (version 18 or higher) — [Download here](https://nodejs.org/)
   - This comes with `npm`, which is used to install project dependencies
2. **Git** — [Download here](https://git-scm.com/downloads)
   - Used to download the project code
3. **Expo Go app** on your phone (optional, for testing the mobile app)
   - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

You'll also need accounts for these services (free tiers are available):

| Service | What it's for | Sign up |
|---------|--------------|---------|
| **Neon** | Hosts your database in the cloud | [neon.tech](https://neon.tech/) |
| **Cloudinary** | Stores restaurant and food images | [cloudinary.com](https://cloudinary.com/) |
| **Google Maps** | Shows maps and locations in the app | [Google Cloud Console](https://console.cloud.google.com/) |

> **Tip:** Payment gateways (Stripe, Paystack, Flutterwave) are optional — the app works without them during development.

---

## Getting Started

### Step 1: Download the project

Open a terminal (Command Prompt, PowerShell, or Terminal) and run:

```bash
git clone https://github.com/YOUR_USERNAME/happy-delivery.git
cd happy-delivery
```

### Step 2: Set up the Backend (Server)

```bash
cd backend
npm install
```

Now create your settings file:

```bash
cp .env.example .env
```

> On Windows (Command Prompt), use `copy .env.example .env` instead.

Open the `.env` file in any text editor and fill in your details:

```env
# Server
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database — get this from your Neon dashboard
DATABASE_URL=postgresql://username:password@your-neon-host/your-database?sslmode=require

# Security — pick any random long string
JWT_SECRET=pick-a-long-random-secret-string-here
JWT_EXPIRES_IN=30d

# Image uploads — get these from your Cloudinary dashboard
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional for now)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# Payments (optional for now)
STRIPE_SECRET_KEY=
PAYSTACK_SECRET_KEY=
FLUTTERWAVE_SECRET_KEY=

# Order timing
DRIVER_ACCEPTANCE_TIME=150000
ORDER_TIMEOUT=300000
```

Start the server:

```bash
npm run dev
```

You should see a message that the server is running on port 5000. You can verify it by opening [http://localhost:5000/health](http://localhost:5000/health) in your browser — you should see a health check response.

### Step 3: Set up the Mobile App

Open a **new terminal window** (keep the backend running in the other one):

```bash
cd mobile-app
npm install
```

Create your settings file:

```bash
cp .env.example .env
```

Open the `.env` file and fill in your details:

```env
# Point these to your running backend server
# Use your computer's local IP address (not "localhost") so your phone can connect
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_COMPUTER_IP:5000

# Google Maps (get from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# App settings
APP_NAME=HappyDeliveries
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_LOCATION_TRACKING=true
```

> **How to find your computer's IP address:**
> - **Windows:** Open Command Prompt and type `ipconfig` — look for "IPv4 Address"
> - **Mac/Linux:** Open Terminal and type `ifconfig` or `ip addr` — look for your Wi-Fi adapter's IP

Start the mobile app:

```bash
npx expo start
```

This will show a QR code in your terminal. Scan it with:
- **Android:** The Expo Go app
- **iPhone:** Your regular Camera app

The app should open on your phone! 🎉

---

## Setting Up the Database

HappyDeliveries uses **PostgreSQL** with the **PostGIS** extension (for location features like "find restaurants near me").

### Using Neon (Recommended)

1. Create a free account at [neon.tech](https://neon.tech/)
2. Create a new project and database
3. Enable the PostGIS extension by running this in Neon's SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Copy your connection string from the Neon dashboard and paste it as `DATABASE_URL` in your backend `.env` file

> The database tables will be created automatically when you first interact with the app's features, as the models handle table creation internally.

---

## Manager Web Dashboard

Restaurant managers also have access to a **web-based dashboard** — no app download needed.

Once the backend is running, open your browser and go to:

```
http://localhost:5000/manager
```

From here, managers can:
- Log in with their account
- View sales dashboards and revenue charts
- Add and manage restaurants
- Create and edit menus
- View and manage incoming orders
- Check analytics and update settings

---

## 📁 Project Structure

Here's a simplified view of how the project is organized:

```
happy-delivery/
│
├── backend/                 # Server-side code
│   ├── server.js            # Main entry point — starts the server
│   ├── src/
│   │   ├── models/          # Database logic (users, orders, restaurants, etc.)
│   │   ├── routes/          # API endpoints the app talks to
│   │   ├── middleware/       # Security & authentication checks
│   │   └── config/          # Database and cloud service connections
│   ├── views/               # Web dashboard pages (for managers)
│   └── public/              # Static files (CSS, images for the dashboard)
│
├── mobile-app/              # Phone app code
│   ├── app/                 # Screens organized by user role
│   │   ├── (auth)/          #   → Login, Register, Welcome screens
│   │   ├── (customer)/      #   → Home, Search, Cart, Orders, Profile
│   │   ├── (driver)/        #   → Dashboard, Available Orders, Earnings
│   │   └── (manager)/       #   → Dashboard, Restaurants, Menus
│   ├── components/          # Reusable UI pieces (buttons, cards, etc.)
│   ├── services/            # Code that talks to the backend server
│   ├── contexts/            # Shared app state (logged-in user, etc.)
│   └── hooks/               # Reusable app logic
│
└── README.md                # You are here!
```

---

## How an Order Works

Here's what happens behind the scenes when someone orders food:

```
Customer places order
        ↓
Order goes to the restaurant (status: pending)
        ↓
Restaurant manager reviews and publishes the order
        ↓
Nearby drivers get notified (based on location)
        ↓
A driver accepts the order
        ↓
Driver heads to the restaurant → picks up food
        ↓
Driver delivers to the customer
        ↓
Customer confirms with a verification code
        ↓
Order complete — driver gets paid!
```

---

## Troubleshooting

**The mobile app can't connect to the backend**
- Make sure both your phone and computer are on the **same Wi-Fi network**
- Double-check the IP address in the mobile app's `.env` file
- Make sure the backend server is running (`npm run dev` in the backend folder)

**"Module not found" errors**
- Try deleting `node_modules` and running `npm install` again
- Make sure you're in the correct folder (backend or mobile-app)

**Database connection errors**
- Verify your `DATABASE_URL` in the backend `.env` file
- Make sure your Neon database is active (free tier databases may pause after inactivity)

**Images not uploading**
- Check your Cloudinary credentials in the backend `.env` file
- Make sure all three values are filled in (cloud name, API key, API secret)

---

## License

This project is for educational and personal use.

---

## Contact

Have questions or want to contribute? Feel free to open an issue on the repository or reach out to the project maintainer.

---

> Built with using Node.js, React Native, and a whole lot of coffee.

