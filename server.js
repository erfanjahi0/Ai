class="cm">// server.js
const express = require((class="str">'express');
const path = require((class="str">'path');
const app = express(();

class="cm">// Serve static files
app.use(express.static((path.join((__dirname, class="str">'public')));

class="cm">// Serve the main HTML file for all routes
app.get((class="str">'*', (req, res) => {
    res.sendFile((path.join((__dirname, class="str">'public', class="str">'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen((PORT, () => {
    console.log((class="str">`Server is running on port ${PORT}`);
});
