# ⬡ NexusAI — Premium GLM-5 AI Workspace

A premium, production-grade AI chat application powered by Zhipu AI's GLM-5 models via BigModel.cn.

---

## ✨ Features

- **Multi-Model Support** — GLM-5 Flash, GLM-5, GLM-5-Zero, GLM-5 Long
- **Thinking Mode** — Extended reasoning with visible thought process
- **File Upload & Download** — ZIP, HTML, CSS, JS, Python, images, PDFs, and more
- **Drag & Drop** — Drop files directly onto the input
- **Auto ZIP Download** — Multi-file code responses generate downloadable .zip
- **Syntax Highlighting** — 190+ languages with Highlight.js
- **Streaming Responses** — Real-time token streaming
- **Chat History** — Firebase-persisted, searchable, renameable, deleteable
- **Auth** — Email/password + Google OAuth via Firebase
- **Settings** — Temperature, max tokens, system prompt, stream toggle
- **Code Actions** — Copy + download per code block
- **Markdown Rendering** — Tables, lists, headers, blockquotes

---

## 🚀 Setup

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google provider
4. Enable **Firestore Database** (Start in test mode, then apply rules)
5. Copy your Firebase config

### 2. Configure Firebase

Replace `YOUR_*` placeholders in **both** files:
- `js/auth.js` — Firebase config
- `js/chat.js` — Firebase config

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

### 3. BigModel API Key

1. Go to [BigModel.cn](https://open.bigmodel.cn/)
2. Register and get your API key
3. Replace in `js/chat.js`:

```js
const BIGMODEL_API_KEY = "your_api_key_here";
```

### 4. Firestore Rules

Deploy the security rules from `firestore.rules` in Firebase Console → Firestore → Rules.

### 5. Deploy

Host on any static file server:

```bash
# Local dev with live-server
npx live-server nexus-ai/

# Or Firebase Hosting
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

---

## 📁 File Structure

```
nexus-ai/
├── index.html          ← Landing page
├── pages/
│   ├── chat.html       ← Main chat interface
│   ├── login.html      ← Login page
│   └── register.html   ← Register page
├── css/
│   ├── landing.css     ← Landing page styles
│   ├── auth.css        ← Auth page styles
│   └── chat.css        ← Chat interface styles
├── js/
│   ├── landing.js      ← Landing page interactions
│   ├── auth.js         ← Firebase auth module
│   └── chat.js         ← Main chat engine
└── firestore.rules     ← Firestore security rules
```

---

## 🔌 Supported Models

| Model ID | Label | Best For |
|---|---|---|
| `glm-4-flash` | GLM-5 Flash | Speed, everyday tasks |
| `glm-4` | GLM-5 | Balanced power |
| `glm-zero-preview` | GLM-5-Zero | Deep reasoning |
| `glm-4-long` | GLM-5 Long | Long context (1M tokens) |

---

## ⚠️ Important Notes

- **API Key Security**: The BigModel API key is embedded in client-side JS. For production, proxy API calls through your own backend.
- **Firebase Auth**: Never expose Firebase private keys. The web config (not Admin SDK) is safe for client use.
- **CORS**: BigModel API supports browser requests with proper Authorization headers.
