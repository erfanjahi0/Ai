# ⬡ NexusAI — Complete Setup & Deployment Guide

> Step-by-step guide to get NexusAI fully running with Firebase Auth, Firestore, and the BigModel GLM-5 API.

---

## Prerequisites

Before starting, make sure you have:

- A **Google account** (for Firebase)
- A **BigModel.cn account** (for GLM-5 API)
- A code editor (VS Code recommended)
- A browser (Chrome or Firefox)

---

## Part 1 — BigModel.cn API Key

### Step 1 — Create a BigModel account

1. Go to [https://open.bigmodel.cn](https://open.bigmodel.cn)
2. Click **注册 / Register** in the top right
3. Sign up with your email or phone number
4. Verify your account via the confirmation email

### Step 2 — Get your API Key

1. After logging in, click your **profile icon** → **API Keys** (or go to [https://open.bigmodel.cn/usercenter/apikeys](https://open.bigmodel.cn/usercenter/apikeys))
2. Click **Create API Key**
3. Give it a name like `nexusai-key`
4. Copy the key — it looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx`

> ⚠️ **Save this key now.** You will not be able to see it again after closing the dialog.

### Step 3 — Paste it into the project

Open `js/chat.js` in your editor. Find this line near the top:

```js
const BIGMODEL_API_KEY = "YOUR_BIGMODEL_API_KEY";
```

Replace `YOUR_BIGMODEL_API_KEY` with your actual key:

```js
const BIGMODEL_API_KEY = "abc123xyz.yourrealkey";
```

---

## Part 2 — Firebase Project Setup

### Step 4 — Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Enter a project name, e.g. `nexusai`
4. Disable Google Analytics if you don't need it (optional)
5. Click **Create project** and wait for it to finish
6. Click **Continue**

### Step 5 — Register a Web App

1. On the Firebase project dashboard, click the **Web icon `</>`**
2. Enter an app nickname, e.g. `nexusai-web`
3. Do **not** check Firebase Hosting yet (we'll handle that separately)
4. Click **Register app**
5. You will see a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "nexusai-xxxxx.firebaseapp.com",
  projectId: "nexusai-xxxxx",
  storageBucket: "nexusai-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. **Copy this entire object** — you'll need it in the next step
7. Click **Continue to console**

### Step 6 — Paste the Firebase config

You need to paste the config into **two files**:

**File 1 — `js/auth.js`**

Find this block near the top:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Replace it entirely with your copied config.

**File 2 — `js/chat.js`**

Find the exact same block near the top of `js/chat.js` and replace it with the same config.

---

## Part 3 — Firebase Authentication

### Step 7 — Enable Email/Password login

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Under the **Sign-in method** tab, click **Email/Password**
4. Toggle the first switch to **Enabled**
5. Leave "Email link (passwordless sign-in)" disabled
6. Click **Save**

### Step 8 — Enable Google login

1. Still in Authentication → Sign-in method
2. Click **Google**
3. Toggle to **Enabled**
4. Set a **Project support email** (your Gmail address)
5. Click **Save**

---

## Part 4 — Firestore Database

### Step 9 — Create the Firestore database

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode** (we'll set rules manually)
4. Select your preferred region (choose the one closest to your users)
5. Click **Done** and wait for provisioning

### Step 10 — Apply security rules

1. In Firestore, click the **Rules** tab
2. Delete everything in the editor
3. Paste the following rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

4. Click **Publish**

> This ensures each user can only access their own data. No one else can read or write your conversations.

---

## Part 5 — Run Locally

### Step 11 — Serve the project

You **cannot** open `index.html` directly in a browser as a file (`file://`) because ES Modules and Firebase imports require an HTTP server.

**Option A — Using VS Code Live Server (easiest)**

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Open the `nexus-ai` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. Your browser will open at `http://127.0.0.1:5500`

**Option B — Using Node.js**

```bash
npx serve nexus-ai
```

Then open `http://localhost:3000` in your browser.

**Option C — Using Python**

```bash
cd nexus-ai
python -m http.server 8080
```

Then open `http://localhost:8080`.

### Step 12 — Test the app

1. Go to `http://localhost:[port]`
2. You should see the NexusAI landing page
3. Click **Get Started** → create an account
4. You should be redirected to the chat interface
5. Send a test message — you should get a streaming response from GLM-5

---

## Part 6 — Deploy to Firebase Hosting (Free)

### Step 13 — Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 14 — Login and initialize

```bash
firebase login
```

This opens a browser window — sign in with your Google account.

```bash
cd nexus-ai
firebase init hosting
```

Answer the prompts:

| Prompt | Answer |
|---|---|
| Which Firebase project? | Select your existing `nexusai` project |
| What's your public directory? | `.` (just a dot, the current folder) |
| Configure as single-page app? | `No` |
| Set up automatic builds with GitHub? | `No` |
| Overwrite existing index.html? | `No` |

### Step 15 — Deploy

```bash
firebase deploy --only hosting
```

After it finishes, you'll see output like:

```
✔  Deploy complete!
Hosting URL: https://nexusai-xxxxx.web.app
```

Your site is now live at that URL. Share it with anyone.

---

## Part 7 — Add Authorized Domains (Required for Google Login)

When you deploy to a custom domain or Firebase Hosting, you must authorize it.

1. Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Add your Firebase Hosting URL: `nexusai-xxxxx.web.app`
5. If using a custom domain, add that too
6. Click **Add**

> Without this step, Google sign-in will fail with an "unauthorized domain" error on your deployed site.

---

## Part 8 — Optional: Custom Domain

### Step 16 — Connect a custom domain

1. Firebase Console → **Hosting** → **Add custom domain**
2. Enter your domain, e.g. `nexusai.yourdomain.com`
3. Firebase will give you two DNS records to add:
   - A TXT record (for verification)
   - An A record (to point traffic to Firebase)
4. Add those records in your domain registrar's DNS settings (Namecheap, GoDaddy, Cloudflare, etc.)
5. Wait for DNS propagation (up to 24 hours, usually under 1 hour)
6. Firebase will auto-provision an SSL certificate

---

## Quick Reference — Files You Edited

| File | What you changed |
|---|---|
| `js/chat.js` | Firebase config + BigModel API key |
| `js/auth.js` | Firebase config |

---

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
→ Add your domain to Firebase Console → Authentication → Settings → Authorized domains

**"API error 401" or "invalid API key"**
→ Double-check your BigModel API key in `js/chat.js`. Make sure there are no extra spaces.

**"Failed to fetch" on API calls**
→ BigModel.cn may be blocked in your region. Try using a VPN or proxying the API through your own backend.

**Google login popup closes immediately**
→ Make sure pop-ups are allowed in your browser for localhost.

**Chat messages not saving**
→ Check that Firestore rules are published correctly (Part 4, Step 10).

**Blank page after deploy**
→ Make sure you answered `.` (not `public`) for the public directory during `firebase init`.

---

*NexusAI — Powered by Zhipu GLM-5 via BigModel.cn*
