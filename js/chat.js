// ================================================================
// NexusAI Chat Engine
// BigModel.cn (Zhipu AI) GLM-5 API Integration
// ================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, onSnapshot, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── FIREBASE CONFIG ──────────────────────────────────────────
// ⚠️ Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ─── BIGMODEL API KEY ─────────────────────────────────────────
// ⚠️ Replace with your BigModel.cn API key
// Get your key at: https://open.bigmodel.cn/
const BIGMODEL_API_KEY = "YOUR_BIGMODEL_API_KEY";
const API_BASE = "https://open.bigmodel.cn/api/paas/v4";

// ─── INIT ─────────────────────────────────────────────────────
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// ─── STATE ────────────────────────────────────────────────────
let currentUser = null;
let currentChatId = null;
let messages = []; // {role, content, files?, thinking?}
let isStreaming = false;
let abortController = null;
let pendingDeleteId = null;
let attachedFiles = []; // {name, type, data, base64, size}
let settings = { temperature: 0.7, maxTokens: 2048, systemPrompt: "You are NexusAI, a powerful AI assistant specialized in software development. You write clean, well-documented code. When producing files, clearly separate them with comments. Always think step by step.", stream: true };
let currentModel = { id: "glm-5", label: "GLM-5", dot: "standard" };
let thinkingMode = false;

// ─── DOM REFS ─────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const chatList = document.getElementById('chatList');
const messagesEl = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcomeScreen');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const attachmentPreviews = document.getElementById('attachmentPreviews');
const currentChatTitle = document.getElementById('currentChatTitle');
const modelBtn = document.getElementById('modelBtn');
const modelLabel = document.getElementById('modelLabel');
const modelDropdown = document.getElementById('modelDropdown');
const thinkBtn = document.getElementById('thinkBtn');
const thinkLabel = document.getElementById('thinkLabel');
const thinkBanner = document.getElementById('thinkBanner');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const newChatBtn = document.getElementById('newChatBtn');
const deleteAllChats = document.getElementById('deleteAllChats');
const logoutBtn = document.getElementById('logoutBtn');
const renameModal = document.getElementById('renameModal');
const renameInput = document.getElementById('renameInput');
const deleteModal = document.getElementById('deleteModal');

// ─── AUTH GUARD ───────────────────────────────────────────────
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  document.getElementById('userName').textContent = user.displayName || 'User';
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userAvatar').textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
  loadChatList();
});

// ─── SIDEBAR ──────────────────────────────────────────────────
document.getElementById('sidebarOpen')?.addEventListener('click', () => sidebar.classList.add('open'));
document.getElementById('sidebarClose')?.addEventListener('click', () => sidebar.classList.remove('open'));
document.addEventListener('click', e => {
  if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target)) {
    sidebar.classList.remove('open');
  }
  if (modelDropdown.classList.contains('open') && !modelBtn.contains(e.target) && !modelDropdown.contains(e.target)) {
    modelDropdown.classList.remove('open');
  }
});

// ─── NEW CHAT ─────────────────────────────────────────────────
newChatBtn.addEventListener('click', startNewChat);
function startNewChat() {
  currentChatId = null;
  messages = [];
  attachedFiles = [];
  attachmentPreviews.innerHTML = '';
  messagesEl.innerHTML = '';
  messagesEl.appendChild(buildWelcome());
  currentChatTitle.textContent = 'New Chat';
  messageInput.value = '';
  updateSendBtn();
  sidebar.classList.remove('open');
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
}

function buildWelcome() {
  const div = document.createElement('div');
  div.className = 'welcome-screen'; div.id = 'welcomeScreen';
  div.innerHTML = `
    <div class="welcome-icon">⬡</div>
    <h2>How can I help you build?</h2>
    <p>Ask me to write code, analyze files, create projects, or anything else.</p>
    <div class="quick-prompts">
      <button class="qp-btn" data-prompt="Write a full-stack Next.js app with a REST API and PostgreSQL">🚀 Full-Stack App</button>
      <button class="qp-btn" data-prompt="Build a Python FastAPI backend with auth, CRUD and Swagger docs">🐍 FastAPI Backend</button>
      <button class="qp-btn" data-prompt="Create a responsive React dashboard with charts and dark mode">📊 React Dashboard</button>
      <button class="qp-btn" data-prompt="Write a complete machine learning pipeline with sklearn and visualizations">🤖 ML Pipeline</button>
    </div>`;
  div.querySelectorAll('.qp-btn').forEach(btn => btn.addEventListener('click', () => {
    messageInput.value = btn.dataset.prompt;
    autoResizeTextarea();
    updateSendBtn();
    sendMessage();
  }));
  return div;
}

// ─── CHAT LIST ────────────────────────────────────────────────
async function loadChatList() {
  if (!currentUser) return;
  const q = query(collection(db, 'users', currentUser.uid, 'chats'), orderBy('updatedAt', 'desc'));
  onSnapshot(q, snap => {
    chatList.innerHTML = '';
    snap.forEach(docSnap => renderChatItem(docSnap.id, docSnap.data()));
  });
}

function renderChatItem(id, data) {
  const item = document.createElement('div');
  item.className = 'chat-item' + (id === currentChatId ? ' active' : '');
  item.dataset.id = id;
  item.innerHTML = `
    <span class="chat-item-icon">◷</span>
    <span class="chat-item-text">${escapeHtml(data.title || 'Untitled Chat')}</span>
    <div class="chat-item-actions">
      <button class="chat-action-btn" data-action="rename" title="Rename">✎</button>
      <button class="chat-action-btn del" data-action="delete" title="Delete">🗑</button>
    </div>`;
  item.addEventListener('click', e => {
    if (e.target.closest('.chat-action-btn')) return;
    loadChat(id, data);
  });
  item.querySelector('[data-action="rename"]').addEventListener('click', () => openRename(id, data.title));
  item.querySelector('[data-action="delete"]').addEventListener('click', () => openDelete(id));
  chatList.appendChild(item);
}

async function loadChat(id, data) {
  currentChatId = id;
  const title = data.title || 'Chat';
  currentChatTitle.textContent = title;
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });
  sidebar.classList.remove('open');
  
  // Load messages from Firestore
  const msgsRef = collection(db, 'users', currentUser.uid, 'chats', id, 'messages');
  const q = query(msgsRef, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  messages = [];
  messagesEl.innerHTML = '';
  snap.forEach(d => {
    const msg = d.data();
    messages.push(msg);
    renderMessage(msg);
  });
  scrollToBottom();
}

// ─── MODEL SELECT ─────────────────────────────────────────────
modelBtn.addEventListener('click', () => modelDropdown.classList.toggle('open'));
document.querySelectorAll('.model-option').forEach(opt => {
  opt.addEventListener('click', () => {
    currentModel = { id: opt.dataset.model, label: opt.dataset.label, dot: opt.dataset.dot };
    modelLabel.textContent = currentModel.label;
    const dotEl = modelBtn.querySelector('.model-dot-sm');
    dotEl.className = 'model-dot-sm ' + currentModel.dot;
    document.querySelectorAll('.model-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    modelDropdown.classList.remove('open');
  });
});

// ─── THINKING MODE ────────────────────────────────────────────
thinkBtn.addEventListener('click', () => {
  thinkingMode = !thinkingMode;
  thinkBtn.classList.toggle('active', thinkingMode);
  thinkBanner.style.display = thinkingMode ? 'flex' : 'none';
});

// ─── SETTINGS ─────────────────────────────────────────────────
settingsBtn.addEventListener('click', () => { settingsModal.style.display = 'flex'; });
document.getElementById('closeSettings')?.addEventListener('click', () => { settingsModal.style.display = 'none'; });
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.style.display = 'none'; });

const tempRange = document.getElementById('tempRange');
const tempVal = document.getElementById('tempVal');
tempRange?.addEventListener('input', () => { settings.temperature = parseFloat(tempRange.value); tempVal.textContent = tempRange.value; });
const tokensRange = document.getElementById('tokensRange');
const tokensVal = document.getElementById('tokensVal');
tokensRange?.addEventListener('input', () => { settings.maxTokens = parseInt(tokensRange.value); tokensVal.textContent = tokensRange.value; });
document.getElementById('streamToggle')?.addEventListener('change', e => { settings.stream = e.target.checked; });
document.getElementById('systemPrompt')?.addEventListener('input', e => { settings.systemPrompt = e.target.value; });

// ─── RENAME ───────────────────────────────────────────────────
function openRename(id, title) {
  pendingDeleteId = id;
  renameInput.value = title || '';
  renameModal.style.display = 'flex';
  setTimeout(() => renameInput.focus(), 100);
}
document.getElementById('closeRename')?.addEventListener('click', () => { renameModal.style.display = 'none'; });
document.getElementById('saveRename')?.addEventListener('click', async () => {
  const title = renameInput.value.trim() || 'Untitled Chat';
  if (pendingDeleteId) {
    await updateDoc(doc(db, 'users', currentUser.uid, 'chats', pendingDeleteId), { title });
    if (pendingDeleteId === currentChatId) currentChatTitle.textContent = title;
  }
  renameModal.style.display = 'none';
});
document.getElementById('editTitleBtn')?.addEventListener('click', () => { if (currentChatId) openRename(currentChatId, currentChatTitle.textContent); });

// ─── DELETE ───────────────────────────────────────────────────
function openDelete(id) { pendingDeleteId = id; deleteModal.style.display = 'flex'; }
document.getElementById('closeDelete')?.addEventListener('click', () => { deleteModal.style.display = 'none'; });
document.getElementById('cancelDelete')?.addEventListener('click', () => { deleteModal.style.display = 'none'; });
document.getElementById('confirmDelete')?.addEventListener('click', async () => {
  if (pendingDeleteId) {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'chats', pendingDeleteId));
    if (pendingDeleteId === currentChatId) startNewChat();
  }
  deleteModal.style.display = 'none';
});
deleteAllChats?.addEventListener('click', async () => {
  if (!confirm('Delete ALL conversations? This cannot be undone.')) return;
  const snap = await getDocs(collection(db, 'users', currentUser.uid, 'chats'));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  startNewChat();
});

// ─── LOGOUT ───────────────────────────────────────────────────
logoutBtn.addEventListener('click', async () => { await signOut(auth); window.location.href = '../index.html'; });

// ─── FILE HANDLING ────────────────────────────────────────────
attachBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const files = Array.from(fileInput.files);
  for (const file of files) await processFile(file);
  fileInput.value = '';
  updateSendBtn();
});

// Drag & drop on textarea
messageInput.addEventListener('dragover', e => { e.preventDefault(); messageInput.style.borderColor = 'var(--accent)'; });
messageInput.addEventListener('dragleave', () => { messageInput.style.borderColor = ''; });
messageInput.addEventListener('drop', async e => {
  e.preventDefault(); messageInput.style.borderColor = '';
  const files = Array.from(e.dataTransfer.files);
  for (const file of files) await processFile(file);
  updateSendBtn();
});

async function processFile(file) {
  const MAX = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX) { alert(`File "${file.name}" too large (max 20MB)`); return; }
  const entry = { name: file.name, type: file.type, size: file.size };
  
  if (file.type.startsWith('image/')) {
    entry.base64 = await toBase64(file);
    entry.kind = 'image';
  } else {
    // Read as text for code/text files, base64 for binary
    const textTypes = ['text/', 'application/json', 'application/javascript', 'application/typescript', 'application/xml'];
    const isText = textTypes.some(t => file.type.startsWith(t)) ||
      /\.(js|ts|jsx|tsx|py|rs|go|java|cpp|c|h|cs|php|rb|sh|md|txt|json|yaml|yml|html|css|xml|toml|ini|env)$/i.test(file.name);
    if (isText) {
      entry.text = await file.text();
      entry.kind = 'text';
    } else if (file.name.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        let content = `[ZIP Archive: ${file.name}]\n\n`;
        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir) {
            try {
              const text = await zipEntry.async('text');
              content += `--- File: ${path} ---\n${text}\n\n`;
            } catch { content += `--- File: ${path} (binary) ---\n\n`; }
          }
        }
        entry.text = content; entry.kind = 'zip';
      } catch { entry.base64 = await toBase64(file); entry.kind = 'binary'; }
    } else {
      entry.base64 = await toBase64(file);
      entry.kind = 'binary';
    }
  }
  attachedFiles.push(entry);
  renderAttachmentChip(entry);
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function renderAttachmentChip(entry) {
  const chip = document.createElement('div');
  chip.className = 'attachment-chip' + (entry.kind === 'image' ? ' image-chip' : '');
  chip.dataset.name = entry.name;
  chip.innerHTML = `
    ${entry.kind === 'image' ? `<img src="data:${entry.type};base64,${entry.base64}" alt="">` : ''}
    <span>${entry.kind === 'image' ? '' : fileIcon(entry.name)} ${entry.name}</span>
    <button class="attachment-chip-remove" title="Remove">×</button>`;
  chip.querySelector('.attachment-chip-remove').addEventListener('click', () => {
    attachedFiles = attachedFiles.filter(f => f.name !== entry.name);
    chip.remove();
    updateSendBtn();
  });
  attachmentPreviews.appendChild(chip);
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = { js:'🟨', ts:'🔷', jsx:'⚛️', tsx:'⚛️', py:'🐍', html:'🌐', css:'🎨', json:'📋', md:'📝', zip:'📦', pdf:'📕', png:'🖼', jpg:'🖼', jpeg:'🖼', svg:'🎨', sh:'📜', go:'🐹', rs:'⚙️' };
  return icons[ext] || '📄';
}

// ─── INPUT HANDLING ───────────────────────────────────────────
messageInput.addEventListener('input', () => { autoResizeTextarea(); updateSendBtn(); charCount.textContent = `${messageInput.value.length} / 50000`; });
messageInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); }
});
function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
}
function updateSendBtn() {
  sendBtn.disabled = isStreaming || (messageInput.value.trim() === '' && attachedFiles.length === 0);
}

// ─── SEND MESSAGE ─────────────────────────────────────────────
async function sendMessage() {
  const text = messageInput.value.trim();
  if (isStreaming || (text === '' && attachedFiles.length === 0)) return;

  // Build message
  const userMsg = { role: 'user', content: text, files: [...attachedFiles] };
  messages.push(userMsg);
  renderMessage(userMsg);
  scrollToBottom();

  // Clear input
  messageInput.value = '';
  autoResizeTextarea();
  attachedFiles = [];
  attachmentPreviews.innerHTML = '';
  updateSendBtn();

  // Remove welcome screen
  const ws = document.getElementById('welcomeScreen');
  ws?.remove();

  // Show typing
  const typingEl = showTyping();
  isStreaming = true;
  updateSendBtn();
  showStopBtn();

  // Create chat in Firestore if needed
  if (!currentChatId) {
    const shortTitle = text ? text.substring(0, 45) + (text.length > 45 ? '…' : '') : (attachedFiles[0]?.name || 'New Chat');
    const chatRef = await addDoc(collection(db, 'users', currentUser.uid, 'chats'), {
      title: shortTitle, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), model: currentModel.id
    });
    currentChatId = chatRef.id;
    currentChatTitle.textContent = shortTitle;
  }

  // Save user msg
  await saveMessage(userMsg);

  // Call API
  try {
    const aiResponse = await callAPI();
    typingEl.remove();
    const aiMsg = { role: 'assistant', content: aiResponse.content, thinking: aiResponse.thinking };
    messages.push(aiMsg);
    renderMessage(aiMsg);
    scrollToBottom();
    await saveMessage(aiMsg);
    await updateDoc(doc(db, 'users', currentUser.uid, 'chats', currentChatId), { updatedAt: serverTimestamp() });
  } catch (err) {
    typingEl.remove();
    if (err.name !== 'AbortError') renderError(err.message || 'API error');
  } finally {
    isStreaming = false;
    abortController = null;
    updateSendBtn();
    hideStopBtn();
  }
}

// ─── API CALL ─────────────────────────────────────────────────
async function callAPI() {
  abortController = new AbortController();

  // Build API messages
  const apiMessages = [];
  if (settings.systemPrompt) apiMessages.push({ role: 'system', content: settings.systemPrompt });
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      const parts = [];
      if (msg.content) parts.push({ type: 'text', text: msg.content });
      if (msg.files) {
        for (const f of msg.files) {
          if (f.kind === 'image') {
            parts.push({ type: 'image_url', image_url: { url: `data:${f.type};base64,${f.base64}` } });
          } else if (f.text) {
            parts.push({ type: 'text', text: `\n\n[File: ${f.name}]\n\`\`\`\n${f.text}\n\`\`\`` });
          } else if (f.base64) {
            parts.push({ type: 'text', text: `\n\n[Binary file attached: ${f.name} (${f.type})]` });
          }
        }
      }
      apiMessages.push({ role: 'user', content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts });
    } else {
      apiMessages.push({ role: 'assistant', content: msg.content || '' });
    }
  }

  const body = {
    model: currentModel.id,
    messages: apiMessages,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    stream: settings.stream,
    ...(thinkingMode && { tools: [{ type: "retrieval" }] })
  };

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BIGMODEL_API_KEY}` },
    body: JSON.stringify(body),
    signal: abortController.signal
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error ${res.status}`);
  }

  if (!settings.stream) {
    const data = await res.json();
    const choice = data.choices?.[0];
    return { content: choice?.message?.content || '', thinking: choice?.message?.reasoning_content || '' };
  }

  // ─── STREAMING ───────────────────────────────────────────
  const aiMsgEl = createStreamingMessage();
  let fullContent = '';
  let thinkingContent = '';
  let inThinking = false;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        if (delta?.reasoning_content) { thinkingContent += delta.reasoning_content; inThinking = true; }
        if (delta?.content) {
          fullContent += delta.content;
          updateStreamingMessage(aiMsgEl, fullContent, thinkingContent);
        }
      } catch { /* ignore parse errors */ }
    }
  }
  updateStreamingMessage(aiMsgEl, fullContent, thinkingContent);
  finalizeStreamingMessage(aiMsgEl, fullContent);
  return { content: fullContent, thinking: thinkingContent };
}

// ─── MESSAGE RENDERING ────────────────────────────────────────
function renderMessage(msg) {
  const isUser = msg.role === 'user';
  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user' : 'ai'}`;
  const avatarText = isUser ? (currentUser?.displayName?.[0] || 'U').toUpperCase() : '⬡';
  
  if (isUser) {
    let filesHtml = '';
    if (msg.files?.length) {
      filesHtml = msg.files.map(f =>
        f.kind === 'image' ? `<img src="data:${f.type};base64,${f.base64}" style="max-width:200px;max-height:200px;border-radius:8px;margin-top:8px;display:block">` :
        `<div class="attachment-chip" style="margin-top:6px;display:inline-flex">${fileIcon(f.name)} ${escapeHtml(f.name)}</div>`
      ).join('');
    }
    div.innerHTML = `
      <div class="msg-avatar">${avatarText}</div>
      <div class="msg-content">
        <div class="msg-bubble">
          ${msg.content ? `<div>${escapeHtml(msg.content).replace(/\n/g, '<br>')}</div>` : ''}
          ${filesHtml}
        </div>
      </div>`;
  } else {
    const thinkingHtml = msg.thinking ? buildThinkingBlock(msg.thinking) : '';
    const contentHtml = renderMarkdown(msg.content || '');
    const fileChips = extractFileDownloads(msg.content || '');
    div.innerHTML = `
      <div class="msg-avatar">⬡</div>
      <div class="msg-content">
        ${thinkingHtml}
        <div class="msg-bubble">${contentHtml}</div>
        ${fileChips}
        <div class="msg-actions">
          <button class="msg-action-btn copy-msg" title="Copy">Copy</button>
        </div>
      </div>`;
    div.querySelector('.copy-msg')?.addEventListener('click', () => copyToClipboard(msg.content || ''));
    highlightCodeBlocks(div);
    attachCodeActions(div);
  }
  messagesEl.appendChild(div);
  return div;
}

function createStreamingMessage() {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.innerHTML = `
    <div class="msg-avatar">⬡</div>
    <div class="msg-content">
      <div class="msg-bubble streaming-content"></div>
    </div>`;
  messagesEl.appendChild(div);
  scrollToBottom();
  return div;
}

function updateStreamingMessage(el, content, thinking) {
  const bubbleEl = el.querySelector('.streaming-content');
  const thinkEl = el.querySelector('.thinking-block');
  if (thinking && !thinkEl) {
    const block = document.createElement('div');
    block.innerHTML = buildThinkingBlock(thinking);
    el.querySelector('.msg-content').insertBefore(block.firstChild, bubbleEl);
  } else if (thinking && thinkEl) {
    const tc = thinkEl.querySelector('.thinking-content');
    if (tc) tc.textContent = thinking;
  }
  bubbleEl.innerHTML = renderMarkdown(content);
  highlightCodeBlocks(el);
  scrollToBottom();
}

function finalizeStreamingMessage(el, content) {
  attachCodeActions(el);
  const fileChips = extractFileDownloads(content);
  if (fileChips) {
    const msgContent = el.querySelector('.msg-content');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fileChips;
    msgContent.appendChild(tempDiv.firstChild);
  }
  const actions = document.createElement('div');
  actions.className = 'msg-actions';
  actions.innerHTML = '<button class="msg-action-btn copy-msg">Copy</button>';
  actions.querySelector('.copy-msg').addEventListener('click', () => copyToClipboard(content));
  el.querySelector('.msg-content').appendChild(actions);
  el.querySelector('.streaming-content')?.classList.remove('streaming-content');
}

function buildThinkingBlock(thinking) {
  const id = 'think-' + Math.random().toString(36).slice(2);
  return `
    <div class="thinking-block">
      <button class="thinking-toggle" onclick="
        const c=document.getElementById('${id}');
        const icon=this.querySelector('.thinking-toggle-icon');
        c.classList.toggle('open');
        icon.classList.toggle('open');
      ">
        <span class="thinking-toggle-icon">▶</span>
        ◎ Thinking Process
        <span style="margin-left:auto;font-size:0.7rem;color:var(--text-muted)">${thinking.split('\n').length} lines</span>
      </button>
      <div class="thinking-content" id="${id}">${escapeHtml(thinking)}</div>
    </div>`;
}

// ─── MARKDOWN RENDERING ───────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  marked.setOptions({ highlight: (code, lang) => { try { return hljs.highlight(code, { language: lang || 'plaintext' }).value; } catch { return code; } }, gfm: true, breaks: true });
  const raw = marked.parse(text);
  // Wrap code blocks with action header
  return raw.replace(/<pre><code class="language-(\w+)">/g, (_, lang) =>
    `<div class="code-wrapper"><div class="code-header"><span class="code-lang-label">${lang}</span><div class="code-actions"><button class="code-action copy-code">Copy</button><button class="code-action dl-code" data-lang="${lang}">Download</button></div></div><pre><code class="language-${lang}">`
  ).replace(/<\/code><\/pre>/g, '</code></pre></div>');
}

function highlightCodeBlocks(container) {
  container.querySelectorAll('pre code').forEach(el => {
    if (!el.dataset.highlighted) { hljs.highlightElement(el); el.dataset.highlighted = 'yes'; }
  });
}

function attachCodeActions(container) {
  container.querySelectorAll('.copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-wrapper')?.querySelector('code')?.textContent || '';
      copyToClipboard(code);
      btn.textContent = '✓ Copied!'; btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
  container.querySelectorAll('.dl-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-wrapper')?.querySelector('code')?.textContent || '';
      const lang = btn.dataset.lang || 'txt';
      const extMap = { javascript:'js', typescript:'ts', python:'py', bash:'sh', html:'html', css:'css', json:'json', rust:'rs', go:'go', java:'java', cpp:'cpp', csharp:'cs', ruby:'rb' };
      downloadFile(code, `code.${extMap[lang] || lang}`, 'text/plain');
    });
  });
}

// ─── FILE DOWNLOADS FROM RESPONSE ────────────────────────────
function extractFileDownloads(content) {
  const files = [];
  // Detect file markers like "# filename.js" or "<!-- file: index.html -->" etc.
  const patterns = [
    /```(\w+)\s*\n(?:\/\/|#|<!--|\/\*)\s*(?:File:|file:|FILENAME:|filename:)?\s*([\w.\-/]+)\s*(?:-->|\*\/)?\n([\s\S]*?)```/g,
  ];
  const codeBlocks = [];
  const fenceRe = /```(\w+)\n([\s\S]*?)```/g;
  let m;
  while ((m = fenceRe.exec(content)) !== null) {
    codeBlocks.push({ lang: m[1], code: m[2] });
  }
  if (codeBlocks.length >= 2) {
    // Multiple code blocks = downloadable project
    return buildZipChip(codeBlocks);
  }
  return '';
}

function buildZipChip(blocks) {
  const id = 'zip-' + Math.random().toString(36).slice(2);
  const extMap = { javascript:'js', typescript:'ts', python:'py', bash:'sh', html:'html', css:'css', json:'json', jsx:'jsx', tsx:'tsx', markdown:'md' };
  setTimeout(() => {
    const btn = document.getElementById(id);
    btn?.addEventListener('click', async () => {
      const zip = new JSZip();
      blocks.forEach((b, i) => {
        const ext = extMap[b.lang] || b.lang;
        zip.file(`file${i + 1}.${ext}`, b.code);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'project.zip'; a.click();
      URL.revokeObjectURL(url);
    });
  }, 100);
  return `<div class="file-downloads"><button class="file-chip" id="${id}"><span class="file-chip-icon">📦</span> Download project.zip (${blocks.length} files)</button></div>`;
}

// ─── TYPING INDICATOR ─────────────────────────────────────────
function showTyping() {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.innerHTML = `<div class="msg-avatar">⬡</div><div class="msg-content"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  messagesEl.appendChild(div);
  scrollToBottom();
  return div;
}

function showStopBtn() {
  sendBtn.style.display = 'none';
  const stop = document.createElement('button');
  stop.className = 'stop-btn'; stop.id = 'stopBtn'; stop.title = 'Stop generating'; stop.textContent = '⏹';
  stop.addEventListener('click', () => { abortController?.abort(); });
  sendBtn.parentNode.insertBefore(stop, sendBtn);
}
function hideStopBtn() {
  document.getElementById('stopBtn')?.remove();
  sendBtn.style.display = '';
}

function renderError(msg) {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.innerHTML = `<div class="msg-avatar">⬡</div><div class="msg-content"><div class="error-msg">⚠️ ${escapeHtml(msg)}</div></div>`;
  messagesEl.appendChild(div);
}

// ─── FIREBASE SAVE ────────────────────────────────────────────
async function saveMessage(msg) {
  if (!currentChatId || !currentUser) return;
  const data = { role: msg.role, content: msg.content || '', createdAt: serverTimestamp() };
  if (msg.thinking) data.thinking = msg.thinking;
  if (msg.files?.length) {
    data.files = msg.files.map(f => ({ name: f.name, type: f.type, kind: f.kind, size: f.size }));
  }
  await addDoc(collection(db, 'users', currentUser.uid, 'chats', currentChatId, 'messages'), data);
}

// ─── UTILS ────────────────────────────────────────────────────
function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); });
}
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// Expose sendMessage for quick prompts
window.sendMsg = sendMessage;
