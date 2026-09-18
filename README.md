# JEXI Accessories

E-commerce storefront and admin dashboard for **JEXI Accessories**, a jewelry brand. Built with Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Prisma 7 and PostgreSQL.

- **Storefront:** home, category pages with filters and sorting, product pages, Gift Boxes, cart with promo codes, checkout (Cash on Delivery), order confirmation, and order tracking by email (no customer accounts or passwords).
- **Admin (`/admin`):** overview stats, orders (the customer is emailed whenever a status changes), products, gift boxes, categories, promo codes, shipping zones for all 27 governorates, and settings.
- **Email:** Gmail SMTP through Nodemailer. The store gets an email for each new order; the customer gets a confirmation and a status-update email.
- **Themes:** dark (black and gold) and light (ivory and bronze). The visitor's choice is remembered.

---

## 1. Requirements

- Node.js 20.9 or newer (built with Node 24)
- PostgreSQL 14 or newer. Docker is the easiest way to run it locally.

## 2. Quick start

```bash
# 1. Install dependencies (this also generates the Prisma client)
npm install

# 2. Create your env file and edit it (see section 3)
cp .env.example .env

# 3. Start Postgres in Docker (skip this if you already have a database)
docker compose up -d

# 4. Create the tables, then load the starter data
npx prisma migrate deploy
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open http://localhost:3000 for the store and http://localhost:3000/admin for the dashboard. To sign in to the dashboard, use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` (by default `admin@jexi.store` / `ChangeMe123!`). **Change this password right away** in Admin → Settings.

> **Port 5432 already in use?** Set `POSTGRES_PORT="5442"` in `.env` and use the same port in `DATABASE_URL`. `docker compose` reads that value.

The seed creates:

- the 6 categories
- 12 sample products in gold, silver and rose-gold variants
- 2 gift boxes
- all 27 governorates, enabled
- two promo codes: `JEXI20` (20% off, 100 uses, 1 per customer) and `WELCOME100` (EGP 100 off orders over EGP 800)
- your admin account

Running the seed again is safe. It never overwrites data that already exists.

## 3. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string |
| `SESSION_SECRET` | ✅ | Signs the admin login cookies. Must be at least 32 random characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `APP_URL` | ✅ in production | The site's public URL, used for links inside emails, e.g. `https://jexi.store` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | seed only | The first admin account |
| `GMAIL_USER` | for email | The Gmail address emails are sent from |
| `GMAIL_APP_PASSWORD` | for email | A Gmail **App Password** (see below), not your normal password |
| `MAIL_FROM` | optional | "From" header. Default: `JEXI Accessories <GMAIL_USER>` |
| `ADMIN_NOTIFICATION_EMAIL` | optional | Where new-order alerts go if no address is set in Admin → Settings. If this is also empty, alerts go to `GMAIL_USER` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | optional | Use an SMTP server other than Gmail. `GMAIL_USER` and `GMAIL_APP_PASSWORD` are then used as its login |
| `BLOB_READ_WRITE_TOKEN` | on Vercel | Added automatically when you connect a Vercel Blob store. When it's set, admin image uploads go to Blob |
| `UPLOAD_DIR` | optional | Folder for uploaded images when Blob isn't set up (local development). Default: `./uploads` |
| `POSTGRES_PORT` | optional | Host port that `docker compose` maps Postgres to |

### Setting up Gmail (App Password)

1. Sign in to the Gmail account the store will send from.
2. Turn on **2-Step Verification** at https://myaccount.google.com/security.
3. Open https://myaccount.google.com/apppasswords, create an app password named "JEXI Store", and copy the 16-character code.
4. In `.env`, set:
   ```env
   GMAIL_USER="yourstore@gmail.com"
   GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
   ```
5. Restart the server. **Admin → Settings → Email notifications** should now show "Sending from …". Put the address that should receive new-order alerts in **New-order notification email**.

If Gmail isn't configured, checkout still works. Emails are skipped and a line is written to the server log instead. Gmail's free sending limit is about 500 emails per day. For more than that, use a transactional email service through the `SMTP_*` variables.

## 4. How it works

### Money
All prices are stored as whole numbers of **piastres** (1 EGP = 100), so there are no rounding errors. The admin forms take EGP and convert them. The helpers are in `src/lib/money.ts`.

### Pricing and the cart
The browser only stores which items are in the cart and their quantities (in localStorage). Prices, stock, discounts and shipping are always calculated on the server by `quoteCart()` in `src/lib/pricing.ts`. The cart drawer, cart page, checkout and order placement all use that same function, so the price the customer sees always matches what they're charged.

### Placing an order
`placeOrder()` in `src/lib/orders.ts` does all of the following in one database transaction:

- takes the items out of stock, only if enough stock is left (two customers can't buy the last piece)
- counts one use of the promo code, only if it's still under its limit
- creates the order, its items and its first status-history entry

If any step fails, nothing is saved. Emails are sent after the response, using `after()`, so checkout stays fast.

### Order statuses
`Pending → Shipped → Delivered`, or `Cancelled`. The customer sees these as a progress line on their order page and on Track Order.

- Every change is saved to the order's timeline, which both the admin and the customer can see.
- When the admin changes a status, the customer is emailed unless "Email the customer" is unticked.
- **Cancelling** puts the items back in stock and gives back the promo-code use. A cancelled order can't be changed again.
- Marking a Cash on Delivery order **Delivered** also marks it as paid.
- **Deleting** an order removes it permanently. If it was still Pending or Shipped, its items go back into stock first.
- On the Orders page, click any row to open the order window. From there you can change the status, or open the full order with **Edit order**.

### Promo codes
- A code can be a percentage or a fixed amount. It has a start date, an end date, an optional total usage limit, an optional per-customer limit (matched by email or phone), and an optional minimum order.
- A code always applies to the whole order, including gift boxes.
- There's no scheduled job. A code simply stops working after its end date or once it reaches its usage limit. The dashboard shows each code's status and its usage (e.g. "34/100").

### Shipping and free shipping
Free shipping is managed in its own **Free Shipping** tab:

- Turn it on or off.
- Optionally limit it to a date range (start and/or end).
- Optionally apply it only to orders over a minimum amount (after any promo discount).

When an order doesn't get free shipping, it pays its governorate's fee from **Shipping Zones**, or the regular fee set in the Free Shipping tab if the governorate has none. Governorates switched off in Shipping Zones don't appear at checkout.

### Products, colors and categories
- A product has a **Price** and an optional **Sale price**. When a sale price is set, customers pay it, the regular price is shown struck through, and the Sale badge is added automatically.
- Colors are managed in **Categories & Colors** (name plus a color picker), and can also be added while editing a product. A color can only be deleted once no product uses it.
- Web addresses (URL slugs) are created automatically from names and never need editing.
- Social links (Instagram, Facebook, TikTok) are set in **Settings**, each with its own "Show in footer" switch.

### Payments
Cash on Delivery is the only method for now. `src/lib/payments/index.ts` defines a `PaymentProvider` interface, and the comments at the top of that file explain how to add a card gateway such as Paymob, Fawry or Stripe.

### Customers and order tracking
Customers don't need an account or password. On **Track Order** (`/track`), a customer enters their email and sees their orders with each order's status line.

To protect privacy, the tracking results only show the order number, date, items, total and status, never the customer's name, address or phone. Searches are rate-limited to stop mass lookups. Every order also has a private link with the full details, which is shown after checkout and included in every email.

### Admin accounts
- Admin sessions use a signed JWT (HS256, using `jose`) in an httpOnly, SameSite cookie that lasts 12 hours. Passwords are hashed with bcrypt.
- `src/proxy.ts` sends signed-out visitors to the login page. Every admin page and server action also checks the session itself (`requireAdmin()`).
- Admins have one of two roles: **Owner** or **Staff**. Only the Owner can add or remove admins or change where new-order alerts are sent.
- **Forgot password:** the "Forgot password?" link on `/admin/login` emails a reset link to **that admin's own email address**, so each admin should sign in with a real inbox (for example a Gmail address). The link works once and expires after 30 minutes. Resetting a password signs that admin out on every other device. This only works once Gmail sending is set up (section 3).

### Security measures
- **Prices and discounts** are always recalculated on the server. Prices sent from the browser are ignored.
- **Rate limits** are stored in Postgres, so they hold across all Vercel instances:
  - admin login: per IP and per account
  - password-reset requests
  - Track Order
  - checkout: 5 orders per 10 minutes per visitor, which stops fake Cash on Delivery orders from locking up stock
  - promo-code attempts
- **Logins** take the same time whether or not the email exists, so response timing can't reveal which emails are registered.
- **Security headers:** clickjacking protection (`X-Frame-Options`, CSP `frame-ancestors`), HSTS, `nosniff` and `Referrer-Policy`. The `X-Powered-By` header is removed.
- **Uploads:** only admins can upload. Local uploads are checked against the file's real contents, not just the declared type. Vercel Blob only accepts image types up to 8 MB. Image URLs are validated.
- **CSRF:** Next.js server actions reject requests from other sites, and the session cookie is SameSite.
- **Session secret:** the app refuses to start with the example `SESSION_SECRET` from `.env.example`.

Remember to run `npx prisma generate` after pulling schema changes. `npm install` does this for you through the `postinstall` script.

### Images
- **On Vercel (with a Blob store connected):** the admin's browser uploads images straight to **Vercel Blob**. Our server only hands out a short-lived upload token, and only to a signed-in admin (`src/app/api/admin/upload/blob/route.ts`). Uploading directly avoids Vercel's 4.5 MB request limit. Images can be up to 8 MB.
- **Locally (no `BLOB_READ_WRITE_TOKEN`):** images are saved to `UPLOAD_DIR` and served from `/uploads/...`.

The sample product images come from `scripts/generate-samples.mjs`. Replace them with real photos from the admin.

## 5. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Build for production, then run the production server |
| `npm run typecheck` | Check the TypeScript types |
| `npm run db:migrate` | Create or apply migrations after editing `prisma/schema.prisma` (development) |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Load the starter data |
| `npm run db:studio` | Open Prisma Studio to browse the data |

## 6. Deploying to Vercel

1. **Import the project:** on vercel.com, go to Add New → Project, import this GitHub repo, and don't deploy yet.
2. **Database:** in the project, open Storage → Create → **Neon (Postgres)** and connect it. This adds `DATABASE_URL`.
3. **Images:** Storage → Create → **Blob**, then connect it. This adds `BLOB_READ_WRITE_TOKEN`.
4. **Environment variables** (Settings → Environment Variables):
   - `SESSION_SECRET`: a new random value, not the one from your local `.env`
   - `APP_URL`: e.g. `https://jexi.vercel.app`
   - `GMAIL_USER` and `GMAIL_APP_PASSWORD`
   - `ADMIN_NOTIFICATION_EMAIL`: the Gmail that should receive order alerts and password-reset links
5. **Create the tables and starter data** from your own computer. Use Neon's *direct* (unpooled) connection string. In PowerShell:
   ```powershell
   $env:DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require"
   $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-strong-password"
   npx prisma migrate deploy
   npm run db:seed
   ```
   Environment variables set in the shell take priority over `.env`, so your local database isn't touched. Re-run `npx prisma migrate deploy` the same way whenever the schema changes.
6. **Deploy.** From then on, every push to `main` deploys automatically.

> Blob needs to be connected **before** the build runs, because the build checks whether it's there. If you connect Blob after deploying, click **Redeploy**.

**Other hosts:** run `npm ci && npx prisma migrate deploy && npm run build && npm start`. Without Blob, uploads are saved to `UPLOAD_DIR`, so the server needs a persistent disk (a VPS, or Railway or Render with a volume).

## 7. Project structure

```
prisma/
  schema.prisma          data models (Product, Variant, Category, GiftBox, PromoCode, Order, …)
  seed.ts                starter data
src/
  app/(store)/           storefront pages
  app/admin/             admin login, dashboard pages and server actions
  app/actions/           storefront server actions (cart quote, checkout, track)
  app/uploads/           serves uploaded images
  components/            UI (store/, admin/, ui/)
  lib/
    pricing.ts           quoteCart(): the single source of truth for totals
    orders.ts            placeOrder() and updateOrderStatus()
    promo.ts shipping.ts promo-code and shipping rules
    email/               Nodemailer transport, HTML templates, notification triggers
    payments/            payment provider registry
    auth.ts session.ts   admin and customer sessions
  proxy.ts               redirects signed-out visitors away from /admin
```
