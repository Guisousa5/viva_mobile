// File: /viva-mobile-frontend/viva-mobile-frontend/src/js/main.js

// Fala automática no Android/desktop, botão "Ouvir resposta" no iPhone/iPad

document.addEventListener("DOMContentLoaded", function() {
    const API_URL = "https://api-viva-vision.onrender.com"; // ajuste se necessário

    const micBtn = document.getElementById('mic-button');
    const cameraBtn = document.getElementById('camera-button');
    const sendBtn = document.getElementById('send-button');
    const cancelBtn = document.getElementById('cancel-button');
    const userInput = document.getElementById('user-input');
    const responseArea = document.getElementById('response-area');
    let listenBtn = document.getElementById('listen-btn');

    // Detecta iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    // Cria botão "Ouvir resposta" se não existir
    if (!listenBtn) {
        listenBtn = document.createElement('button');
        listenBtn.id = "listen-btn";
        listenBtn.className = "viva-btn send";
        listenBtn.style.display = "none";
        listenBtn.style.marginTop = "10px";
        listenBtn.setAttribute("aria-label", "Ouvir resposta");
        listenBtn.innerHTML = `
            <span class="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
            </span>
            Ouvir resposta
        `;
        responseArea.insertAdjacentElement('afterend', listenBtn);
    }

    function speak(text) {
        if ('speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'pt-BR';
            utter.rate = 1.05;
            utter.pitch = 1.1;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
        }
    }

    // Reconhecimento de voz (Speech Recognition)
    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        micBtn.addEventListener('click', () => {
            speak("Viva ouvindo");
            recognition.start();
            micBtn.classList.add('active');
        });
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            userInput.value = transcript;
            micBtn.classList.remove('active');
            if (transcript.includes("descrever")) {
                cameraBtn.click(); // Abre a função descrever (câmera)
            } else {
                sendPergunta();
            }
        };
        recognition.onend = () => micBtn.classList.remove('active');
        recognition.onerror = () => micBtn.classList.remove('active');
    } else {
        micBtn.disabled = true;
        micBtn.title = "Reconhecimento de voz não suportado";
    }

    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPergunta();
        }
    });

    sendBtn.addEventListener('click', sendPergunta);

    async function sendPergunta() {
        const pergunta = userInput.value.trim();
        if (!pergunta) return;
        responseArea.textContent = "Pensando...";
        responseArea.classList.add('thinking');
        sendBtn.classList.add('active');
        listenBtn.style.display = "none";
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pergunta })
            });
            const data = await res.json();
            responseArea.textContent = data.resposta || "Sem resposta.";
            responseArea.classList.remove('thinking');
            if (data.resposta) {
                if (isIOS) {
                    listenBtn.style.display = "block";
                    listenBtn.onclick = () => speak(data.resposta);
                } else {
                    listenBtn.style.display = "none";
                    speak(data.resposta);
                }
            } else {
                listenBtn.style.display = "none";
            }
        } catch (e) {
            responseArea.textContent = "Erro ao conectar ao assistente.";
            responseArea.classList.remove('thinking');
            listenBtn.style.display = "none";
        }
        sendBtn.classList.remove('active');
    }

    cancelBtn.addEventListener('click', () => {
        userInput.value = "";
        responseArea.textContent = "";
        listenBtn.style.display = "none";
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (recognition && recognition.abort) recognition.abort();
    });

    cameraBtn.addEventListener('click', async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            responseArea.textContent = "Câmera não suportada neste dispositivo.";
            return;
        }
        cameraBtn.classList.add('active');
        listenBtn.style.display = "none";

        let facingMode = "environment"; // padrão: traseira

        // Função para abrir a câmera com o modo desejado
        async function openCamera(mode) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: mode } }
                });
                const video = document.createElement('video');
                video.srcObject = stream;
                video.setAttribute('playsinline', 'true');
                video.style.position = "fixed";
                video.style.top = "0";
                video.style.left = "0";
                video.style.width = "100vw";
                video.style.height = "100vh";
                video.style.objectFit = "cover";
                video.style.zIndex = "9999";
                video.style.background = "#000";
                await video.play();

                speak("Toque em qualquer lugar para capturar.");

                // Botão para alternar câmera
                const switchBtn = document.createElement('button');
                switchBtn.textContent = mode === "environment" ? "Usar câmera frontal" : "Usar câmera traseira";
                switchBtn.className = "viva-btn camera";
                switchBtn.style.position = "fixed";
                switchBtn.style.bottom = "40px";
                switchBtn.style.left = "50%";
                switchBtn.style.transform = "translateX(-50%)";
                switchBtn.style.zIndex = "10001";

                document.body.appendChild(video);
                document.body.appendChild(switchBtn);

                switchBtn.onclick = () => {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(video);
                    document.body.removeChild(switchBtn);
                    openCamera(mode === "environment" ? "user" : "environment");
                };

                // Captura foto ao clicar/tocar no vídeo
                video.onclick = async () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(video);
                    document.body.removeChild(switchBtn);

                    responseArea.innerHTML = "Analisando imagem...";

                    const base64 = canvas.toDataURL('image/jpeg');
                    const res = await fetch(`${API_URL}/analisar-imagem`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: base64 })
                    });
                    const data = await res.json();
                    responseArea.textContent = data.caption || "Sem descrição.";
                    if (data.caption) {
                        if (isIOS) {
                            listenBtn.style.display = "block";
                            listenBtn.onclick = () => speak(data.caption);
                        } else {
                            listenBtn.style.display = "none";
                            speak(data.caption);
                        }
                    } else {
                        listenBtn.style.display = "none";
                    }
                    cameraBtn.classList.remove('active');
                };
            } catch (e) {
                responseArea.textContent = "Erro ao acessar a câmera.";
                listenBtn.style.display = "none";
                cameraBtn.classList.remove('active');
            }
        }

        // Abre a câmera inicialmente com a traseira
        openCamera(facingMode);
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
});
