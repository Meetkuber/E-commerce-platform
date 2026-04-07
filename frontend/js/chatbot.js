/**
 * Chatbot Widget — AI Shopping Assistant
 */

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('chatbotToggle');
    const window_ = document.getElementById('chatbotWindow');
    const close = document.getElementById('chatbotClose');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSend');
    const messages = document.getElementById('chatbotMessages');

    if (!toggle || !window_) return;

    // Toggle chatbot
    toggle.addEventListener('click', () => {
        window_.classList.toggle('active');
        if (window_.classList.contains('active')) {
            input.focus();
        }
    });

    close.addEventListener('click', () => {
        window_.classList.remove('active');
    });

    // Send message
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, 'user');
        input.value = '';

        // Show typing indicator
        const typingId = addTypingIndicator();

        // Call API
        ApiClient.askChatbot(text)
            .then(data => {
                removeTypingIndicator(typingId);
                addMessage(data.reply, 'bot');

                // Show product cards
                if (data.products && data.products.length > 0) {
                    const productsHtml = data.products.map(p => `
                        <div class="chat-product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                            <div class="cp-name">${p.name}</div>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="cp-price">₹${formatPrice(p.price)}</span>
                                <span class="cp-rating">${'★'.repeat(Math.floor(p.rating || 0))} ${p.rating || 'N/A'}</span>
                            </div>
                        </div>
                    `).join('');

                    addMessage(productsHtml, 'bot', true);
                }
            })
            .catch(error => {
                removeTypingIndicator(typingId);
                addMessage("Sorry, I'm having trouble connecting. Please try again!", 'bot');
            });
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function addMessage(text, type, isHtml = false) {
        const msg = document.createElement('div');
        msg.className = `chat-message ${type}`;
        if (isHtml) {
            msg.innerHTML = text;
        } else {
            msg.textContent = text;
        }
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return msg;
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msg = document.createElement('div');
        msg.className = 'chat-message bot';
        msg.id = id;
        msg.innerHTML = '<div class="d-flex gap-1"><span class="spinner-sm spinner"></span> <span style="font-size:0.85rem;color:var(--text-tertiary)">Searching...</span></div>';
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
