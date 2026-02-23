class="cm">// script.js
document.addEventListener((class="str">'DOMContentLoaded', () => {
    const chatForm = document.getElementById((class="str">'chat-form');
    const userInput = document.getElementById((class="str">'user-input');
    const chatMessages = document.getElementById((class="str">'chat-messages');
    const sendButton = document.getElementById((class="str">'send-button');
    const apiKeyInput = document.getElementById((class="str">'api-key');
    const modelSelect = document.getElementById((class="str">'model-select');
    
    class="cm">// Load API key from localStorage if available
    const savedApiKey = localStorage.getItem((class="str">'bigmodelApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
    
    class="cm">// Save API key to localStorage when it changes
    apiKeyInput.addEventListener((class="str">'change', () => {
        localStorage.setItem((class="str">'bigmodelApiKey', apiKeyInput.value);
    });
    
    chatForm.addEventListener((class="str">'submit', async (e) => {
        e.preventDefault(();
        
        const userMessage = userInput.value.trim(();
        if (!userMessage) return;
        
        class="cm">// Add user message to chat
        addMessageToChat((userMessage, class="str">'user');
        userInput.value = class="str">'';
        
        class="cm">// Disable input while waiting for response
        sendButton.disabled = true;
        
        try {
            const response = await getBotResponse((userMessage);
            addMessageToChat((response, class="str">'bot');
        } catch((error) {
            addMessageToChat((class="str">`Error: ${error.message}`, class="str">'bot');
        } finally {
            sendButton.disabled = false;
            userInput.focus(();
        }
    });
    
    function addMessageToChat((message, sender) {
        const messageDiv = document.createElement((class="str">'div');
        messageDiv.classList.add((class="str">'message', class="str">`${sender}-message`);
        
        const avatarDiv = document.createElement((class="str">'div');
        avatarDiv.classList.add((class="str">'message-avatar');
        avatarDiv.textContent = sender === class="str">'user' ? class="str">'👤' : class="str">'🤖';
        
        const contentDiv = document.createElement((class="str">'div');
        contentDiv.classList.add((class="str">'message-content');
        contentDiv.textContent = message;
        
        messageDiv.appendChild((avatarDiv);
        messageDiv.appendChild((contentDiv);
        
        chatMessages.appendChild((messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function getBotResponse((userMessage) {
        const apiKey = apiKeyInput.value.trim(();
        if (!apiKey) {
            throw new Error((class="str">'Please enter your BigModel API key');
        }
        
        const model = modelSelect.value;
        
        const apiUrl = class="str">`https:class="cm">//open.bigmodel.cn/api/paas/v3/model-api/${model}/invoke`;
        
        const requestBody = {
            model: model,
            prompt: userMessage
        };
        
        const response = await fetch((apiUrl, {
            method: class="str">'POST',
            headers: {
                class="str">'Content-Type': class="str">'application/json',
                class="str">'Authorization': class="str">`Bearer ${apiKey}`
            },
            body: JSON.stringify((requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json(();
            throw new Error((errorData.error?.message || class="str">'Failed to get response from BigModel API');
        }
        
        const data = await response.json(();
        return data.data || class="str">'I apologize, but I couldn\'t generate a response.';
    }
});


json
Copy
// package.json
{
  "name": "ai-chat-bigmodel",
  "version": "1.0.0",
  "description": "AI Chat application using BigModel.cn API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build step required for static site'"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/ai-chat-bigmodel.git"
  },
  "author": "",
  "license": "MIT",
  "engines": {
    "node": "18.x"
  }
}
