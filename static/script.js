document.addEventListener("DOMContentLoaded", function () {

    const themeToggle = document.getElementById("themeToggle");
    const messageInput = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const voiceButton = document.getElementById("voiceButton");
    const clearChat = document.getElementById("clearChat");

    const welcomeScreen = document.getElementById("welcomeScreen");
    const chatScreen = document.getElementById("chatScreen");
    const messages = document.getElementById("messages");
    const typingIndicator = document.getElementById("typingIndicator");
    const toast = document.getElementById("toast");

    let isDarkMode = true;
    let isListening = false;
    let recognition = null;


    /* =========================
       THEME
    ========================= */

    const savedTheme = localStorage.getItem("sportiq-theme");

    if (savedTheme === "light") {
        enableLightTheme();
    } else {
        enableDarkTheme();
    }

    themeToggle.addEventListener("click", function () {

        if (isDarkMode) {
            enableLightTheme();
        } else {
            enableDarkTheme();
        }

    });


    function enableLightTheme() {

        document.body.classList.add("light-theme");

        isDarkMode = false;

        themeToggle.textContent = "🌙";

        themeToggle.title = "Switch to dark mode";

        localStorage.setItem("sportiq-theme", "light");
    }


    function enableDarkTheme() {

        document.body.classList.remove("light-theme");

        isDarkMode = true;

        themeToggle.textContent = "☀️";

        themeToggle.title = "Switch to light mode";

        localStorage.setItem("sportiq-theme", "dark");
    }


    /* =========================
       SEND MESSAGE
    ========================= */

    sendButton.addEventListener("click", function () {
        sendMessage();
    });


    messageInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            sendMessage();
        }

    });


    async function sendMessage(customMessage = null) {

        const text = customMessage || messageInput.value.trim();

        if (!text) {
            return;
        }


        openChat();

        addUserMessage(text);

        messageInput.value = "";

        resizeTextarea();

        showTyping();


        /* =========================
           OPENROUTER BACKEND
        ========================= */

        try {

            const response = await fetch("/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    message: `
Answer the user's sports question as SportIQ AI.

IMPORTANT RESPONSE RULES:

1. Keep the answer concise and useful.
2. Normally keep the response between 50 and 120 words.
3. For simple questions, answer in 2–5 sentences.
4. Give the direct answer first.
5. Use short headings when useful.
6. Use bullet points when listing multiple facts.
7. Use numbered steps for "how to" questions.
8. Keep paragraphs short.
9. Do not repeat the user's question.
10. Do not provide unnecessary background information.
11. Do not repeat the same information.
12. Do not add unnecessary conclusions.
13. Answer only what the user is asking.
14. If the question requires more explanation, provide the necessary information but remain concise.
15. Make the answer easy to scan and understand.
16. Use emojis only when they genuinely improve readability.
17. Do not use extremely long paragraphs.
18. Do not start with phrases like "Sure!", "Of course!", or "Absolutely!" unless appropriate.
19. For comparisons, use a simple table or bullet points when useful.
20. For definitions, give the definition first and then 2–4 key points.
21. For statistics or records, provide only the most relevant figures.
22. For current sports information, answer with the information available to you and avoid inventing facts.

USER'S QUESTION:
${text}
`
                })

            });


            const data = await response.json();


            hideTyping();


            if (!response.ok) {

                addBotMessage(
                    data.error ||
                    "Sorry, something went wrong while connecting to the AI."
                );

                return;
            }


            addBotMessage(
                data.response ||
                "Sorry, I couldn't generate a response."
            );


        } catch (error) {

            console.error("Chat error:", error);

            hideTyping();

            addBotMessage(
                "Sorry, I couldn't connect to the AI server. Please make sure the backend server is running."
            );

        }

    }


    /* =========================
       OPEN CHAT
    ========================= */

    function openChat() {

        welcomeScreen.classList.add("hidden");

        chatScreen.classList.add("active");

        scrollToBottom();
    }


    /* =========================
       USER MESSAGE
    ========================= */

    function addUserMessage(text) {

        const message = document.createElement("div");

        message.className = "message user";

        message.innerHTML = `
            <div class="avatar">
                U
            </div>

            <div class="message-content">

                <span class="message-name">
                    You
                </span>

                <div class="message-bubble">
                    ${escapeHTML(text).replace(/\n/g, "<br>")}
                </div>

                <span class="message-time">
                    ${getCurrentTime()}
                </span>

            </div>
        `;

        messages.appendChild(message);

        scrollToBottom();
    }


    /* =========================
       BOT MESSAGE
    ========================= */

    function addBotMessage(text) {

        const message = document.createElement("div");

        message.className = "message bot";

        message.innerHTML = `
            <div class="avatar">
                ⚡
            </div>

            <div class="message-content">

                <span class="message-name">
                    SportIQ AI
                </span>

                <div class="message-bubble">
                    ${formatBotText(text)}
                </div>

                <span class="message-time">
                    ${getCurrentTime()}
                </span>

            </div>
        `;

        messages.appendChild(message);

        scrollToBottom();
    }


    /* =========================
       SPORTS CARDS
    ========================= */

    const sportCards = document.querySelectorAll(".sport-card");

    sportCards.forEach(function (card) {

        card.addEventListener("click", function () {

            const prompt = card.getAttribute("data-prompt");

            if (prompt) {
                sendMessage(prompt);
            }

        });

    });


    /* =========================
       QUICK QUESTIONS
    ========================= */

    const quickButtons = document.querySelectorAll(".quick-btn");

    quickButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const prompt = button.getAttribute("data-prompt");

            if (prompt) {
                sendMessage(prompt);
            }

        });

    });


    /* =========================
       TYPING INDICATOR
    ========================= */

    function showTyping() {

        typingIndicator.classList.add("active");

        scrollToBottom();
    }


    function hideTyping() {

        typingIndicator.classList.remove("active");
    }


    /* =========================
       CLEAR CHAT
    ========================= */

    clearChat.addEventListener("click", function () {

        messages.innerHTML = "";

        hideTyping();

        welcomeScreen.classList.remove("hidden");

        chatScreen.classList.remove("active");

        messageInput.value = "";

        resizeTextarea();

        showToast("Conversation cleared");
    });


    /* =========================
       TEXTAREA RESIZE
    ========================= */

    messageInput.addEventListener("input", function () {

        resizeTextarea();

    });


    function resizeTextarea() {

        messageInput.style.height = "auto";

        messageInput.style.height =
            Math.min(messageInput.scrollHeight, 130) + "px";
    }


    /* =========================
       VOICE INPUT
    ========================= */

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (SpeechRecognition) {

        recognition = new SpeechRecognition();

        recognition.continuous = false;

        recognition.interimResults = false;

        recognition.lang = "en-US";


        voiceButton.addEventListener("click", function () {

            if (isListening) {

                recognition.stop();

                return;
            }


            try {

                recognition.start();

                isListening = true;

                voiceButton.classList.add("recording");

                voiceButton.textContent = "⏹️";

                showToast("Listening...");

            } catch (error) {

                console.log(error);

            }

        });


        recognition.onresult = function (event) {

            const transcript =
                event.results[0][0].transcript;

            messageInput.value = transcript;

            resizeTextarea();

            showToast("Voice input added");
        };


        recognition.onend = function () {

            isListening = false;

            voiceButton.classList.remove("recording");

            voiceButton.textContent = "🎙️";
        };


        recognition.onerror = function () {

            isListening = false;

            voiceButton.classList.remove("recording");

            voiceButton.textContent = "🎙️";

            showToast("Voice input unavailable");
        };

    } else {

        voiceButton.addEventListener("click", function () {

            showToast(
                "Voice input is not supported in this browser"
            );

        });

    }


    /* =========================
       TOAST
    ========================= */

    let toastTimer;

    function showToast(message) {

        clearTimeout(toastTimer);

        toast.textContent = message;

        toast.classList.add("show");

        toastTimer = setTimeout(function () {

            toast.classList.remove("show");

        }, 2200);
    }


    /* =========================
       CURRENT TIME
    ========================= */

    function getCurrentTime() {

        return new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    }


    /* =========================
       BOT TEXT FORMAT
    ========================= */

    function formatBotText(text) {

        return escapeHTML(text)
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    }


    /* =========================
       SECURITY
    ========================= */

    function escapeHTML(text) {

        const element =
            document.createElement("div");

        element.textContent = text;

        return element.innerHTML;
    }


    /* =========================
       SCROLL
    ========================= */

    function scrollToBottom() {

        setTimeout(function () {

            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });

        }, 80);

    }

});