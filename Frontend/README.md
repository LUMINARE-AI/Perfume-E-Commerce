# Perfume E-Commerce

A full-stack perfume e-commerce application with a React + Vite frontend and an Express + MongoDB backend.

## Project Overview

- Frontend: React 19, Vite, Tailwind CSS, React Router, Axios
- Backend: Express 5, MongoDB, Mongoose, JWT auth, file uploads, Razorpay payments, Delhivery tracking, email reset flow
- Deployment-ready endpoints are mounted under `/api` in Backend
- Frontend currently points to a production API base URL in `src/api/axios.js`

## Key Features

- Product catalog, product details, and navigation
- Cart management and checkout flow
- User authentication: login, register, password reset, refresh token support
- Order history, order details, and order success pages
- User dashboard: profile, orders, addresses, security
- Admin dashboard for users, orders, and reviews
- Reviews, contact form, FAQ, policies, terms, and privacy pages
- Image uploads and Cloudinary integration
- Razorpay payment gateway integration
- Delhivery shipment/tracking integration and cron jobs
- Responsive UI with smooth scrolling and toast notifications

## Repo Structure

- `Backend/`
  - `src/index.js` — backend entry point
  - `src/app.js` — Express app setup and route mounting
  - `src/db/index.js` — MongoDB connection
  - `src/routes/` — API route definitions
  - `src/controllers/` — request handlers and business logic
  - `src/models/` — Mongoose models
  - `src/services/` — third-party service integrations
  - `src/utils/` — helpers, email, cloudinary, Delhivery adapters
- `Frontend/`
  - `src/main.jsx` — React entry point
  - `src/App.jsx` — route definitions and layout
  - `src/api/axios.js` — Axios API client
  - `src/pages/` — UI pages for users and admins
  - `src/components/` — reusable layout and UI components
  - `src/contexts/` — cart and toast state management

## Setup Instructions

### Backend

1. Open a terminal and navigate to `Backend`:
   ```bash
   cd Backend
   npm install
   ```
2. Create a `.env` file with your environment variables.
3. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend

1. Open a terminal and navigate to `Frontend`:
   ```bash
   cd Frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Local API Configuration

The frontend is currently configured to use:

```js
baseURL: "https://api.binkhalid.in/api"
```

For local development, update `Frontend/src/api/axios.js` to point at your backend, for example:

```js
baseURL: "http://localhost:8000/api"
```

## Recommended Backend Environment Variables

The backend uses these environment variables:

- `MONGODB_URI`
- `PORT`
- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRY`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `DELHIVERY_API_KEY`
- `DELHIVERY_TOKEN`
- `DELHIVERY_STAGING_BASE`
- `DELHIVERY_TRACK_BASE`
- `DELHIVERY_PICKUP_NAME`
- `SELLER_NAME`
- `SELLER_ADDRESS`
- `SELLER_GST`

> Note: Some of these values are optional or only required for integrations such as Razorpay, Cloudinary, Delhivery, and email delivery.

## Available Scripts

### Frontend

- `npm run dev` — start Vite development server
- `npm run build` — build production frontend assets
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

### Backend

- `npm run dev` — start backend with nodemon
- `npm start` — start backend with Node

## Notes

- The backend enables CORS for local development and preview domains.
- Admin routes are available under `/admin` in the frontend UI.
- User routes and protected pages require authentication.

## Contact

If you want to extend the project, add API environment handling in the frontend and create a root-level `README.md` for repo-wide documentation.

