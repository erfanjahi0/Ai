# Blogger Facebook Cloaker — Vercel Setup

A Next.js app deployed on Vercel that serves rich Open Graph (OG) preview metadata to Facebook's link crawler, while silently redirecting real human visitors who click through Facebook to your actual Blogger post.

---

## How It Works

When you share a link from this Vercel app on Facebook:

1. **Facebook's crawler** visits the URL → it sees the full OG tags (title, description) fetched from your Blogger post via the Blogger API → Facebook generates a rich link preview card.
2. **A real person clicks** your Facebook post → they have a `facebook.com` referer or a `fbclid` param in the URL → they are instantly redirected to the real post on your Blogger blog.

Nobody sees the Vercel URL directly. It just works in the background to make your Facebook shares look great.

---

## Requirements

- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account (free) — to connect with Vercel
- A Google API Key with **Blogger API v3** enabled (free, no payment method needed)
- Your Blogger Blog ID
- A public Blogger blog

---

## Step 1 — Get Your Google API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** at the top → **New Project** → give it any name → **Create**
3. In the left sidebar go to **APIs & Services** → **Library**
4. Search for **Blogger API v3** → click it → click **Enable**
5. Go to **APIs & Services** → **Credentials**
6. Click **+ Create Credentials** → **API Key**
7. Copy the API key shown — that's your `BLOGGER_API_KEY`

> No billing account or payment method needed. Blogger API is completely free.

---

## Step 2 — Get Your Blogger Blog ID

1. Open [blogger.com](https://blogger.com) and sign in
2. Select your blog
3. Go to **Settings** (left sidebar)
4. Scroll down to the **Basic** section
5. You will see **Blog ID** — it's a long number like `1234567890123456789`
6. Copy it — that's your `BLOGGER_BLOG_ID`

---

## Step 3 — Set Up the Project Locally (Optional)

If you want to test locally before deploying:

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file
cp .env.example .env.local

# 3. Open .env.local and fill in your 3 values:
#    BLOGGER_API_KEY
#    BLOGGER_BLOG_ID
#    BLOG_DOMAIN

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the homepage just says "Welcome / Nothing to see here."

To test a post, use a path that matches a real post on your blog. For example if your blog has a post at `yourblog.blogspot.com/2024/01/my-post.html`, visit:
```
http://localhost:3000/2024/01/my-post.html
```

If your API key, Blog ID, and domain are correct, it will render the post title and content.

---

## Step 4 — Push to GitHub

1. Create a new **private** repository on GitHub (private is recommended)
2. Initialize and push:

```bash
git init
git add .
git commit -m "Initial setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

> Make sure `.env.local` is in `.gitignore` (it already is) — **never push your API key to GitHub.**

---

## Step 5 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project**
3. Import your GitHub repository
4. In the **Configure Project** screen, open **Environment Variables** and add all three:

   | Name | Value |
   |---|---|
   | `BLOGGER_API_KEY` | Your Google API Key |
   | `BLOGGER_BLOG_ID` | Your Blogger Blog ID |
   | `BLOG_DOMAIN` | e.g. `yourblog.blogspot.com` |

5. Click **Deploy**
6. Wait ~1 minute — Vercel will give you a URL like `your-project.vercel.app`

---

## Step 6 — Using Your Vercel URL on Facebook

Your Vercel URL mirrors your Blogger post URLs. So if your blog post is at:
```
https://yourblog.blogspot.com/2024/01/my-post.html
```

Share this link on Facebook instead:
```
https://your-project.vercel.app/2024/01/my-post.html
```

Facebook will show a rich preview from your post. Anyone who clicks it will land on your actual Blogger post.

### How to Build the Share URL

Just take your full Blogger post URL and replace the domain part:

```
Original:  https://yourblog.blogspot.com/2024/01/my-post.html
Cloaker:   https://your-project.vercel.app/2024/01/my-post.html
```

---

## Project Structure

```
├── pages/
│   ├── [...postpath].tsx   ← Core logic: OG tags + redirect
│   ├── _app.tsx            ← App wrapper
│   └── index.tsx           ← Blank homepage
├── styles/
│   ├── globals.css
│   └── Home.module.css
├── public/
│   └── favicon.ico
├── .env.example            ← Copy this to .env.local
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `BLOGGER_API_KEY` | Google API key with Blogger API v3 enabled | `AIzaSy...` |
| `BLOGGER_BLOG_ID` | Your Blogger blog's numeric ID | `1234567890123456789` |
| `BLOG_DOMAIN` | Your blog domain, no `https://` | `yourblog.blogspot.com` |

---

## Troubleshooting

**Getting a 404 on a post path?**
- Make sure the path in the URL exactly matches the path of the post on your Blogger blog
- Check that your Blog ID is correct in Vercel environment variables
- Make sure your blog is set to **Public** in Blogger settings

**Facebook still not showing a rich preview?**
- Use the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and paste your Vercel URL to force a re-scrape

**API key error in logs?**
- Go back to Google Cloud Console and make sure Blogger API v3 is enabled for your project
- Make sure the key is correctly pasted in Vercel environment variables with no extra spaces

**After updating environment variables on Vercel:**
- Go to your project → **Deployments** → click the three dots on the latest deployment → **Redeploy** (to apply new env vars)

---

## Notes

- The `graphql-request` dependency from the original WordPress version has been completely removed — this project uses native `fetch` instead, keeping dependencies minimal.
- The homepage (`/`) intentionally shows nothing — it's not meant to be visited directly.
