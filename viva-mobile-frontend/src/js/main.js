// File: /viva-mobile-frontend/viva-mobile-frontend/src/js/main.js

// Fala automática no Android/desktop, botão "Ouvir resposta" no iPhone/iPad

document.addEventListener("DOMContentLoaded", function() {
    const API_URL = "https://api-viva-vision.onrender.com";
    const micBtn = document.getElementById('mic-button');
    const responseArea = document.getElementById('response-area');
    let listenBtn = document.getElementById('listen-btn');
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

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

    // Reconhecimento de voz
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
            micBtn.classList.remove('active');
            if (transcript.includes("frontal")) {
                abrirCamera(true); // Abre a câmera frontal
            } else if (transcript.includes("descrever")) {
                abrirCamera(); // Abre a câmera traseira
            } else {
                sendPergunta(transcript);
            }
        };
        recognition.onend = () => micBtn.classList.remove('active');
        recognition.onerror = () => micBtn.classList.remove('active');
    } else {
        micBtn.disabled = true;
        micBtn.title = "Reconhecimento de voz não suportado";
    }

    async function sendPergunta(pergunta) {
        if (!pergunta) return;
        responseArea.textContent = "Pensando...";
        responseArea.classList.add('thinking');
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
    }

    // Função para abrir a câmera e descrever
    async function abrirCamera(frontal = false) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            responseArea.textContent = "Câmera não suportada neste dispositivo.";
            return;
        }

        let facingMode = frontal ? "user" : "environment";
        try {
            // Overlay escuro
            const overlay = document.createElement('div');
            overlay.className = "camera-overlay";
            overlay.style.position = "fixed";
            overlay.style.inset = "0";
            overlay.style.background = "rgba(16,16,32,0.88)";
            overlay.style.zIndex = "9998";
            document.body.appendChild(overlay);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: facingMode } }
            });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.setAttribute('playsinline', 'true');
            video.style.position = "fixed";
            video.style.top = "0";
            video.style.left = "0";
            video.style.width = "100vw";
            video.style.height = "100vh";
            video.style.transform = "none";
            video.style.objectFit = "cover";
            video.style.zIndex = "9999";
            video.style.borderRadius = "0";
            video.style.boxShadow = "none";
            await video.play();

            // Mensagem de instrução como botão para mudar para câmera frontal
            const instrucao = document.createElement('button');
            instrucao.textContent = "Mude para câmera frontal clicando abaixo";
            instrucao.style.position = "fixed";
            instrucao.style.left = "50%";
            instrucao.style.bottom = "48px";
            instrucao.style.transform = "translateX(-50%)";
            instrucao.style.background = "#222c";
            instrucao.style.color = "#fff";
            instrucao.style.padding = "12px 24px";
            instrucao.style.borderRadius = "18px";
            instrucao.style.fontSize = "1.15rem";
            instrucao.style.zIndex = "10001";
            instrucao.style.textAlign = "center";
            instrucao.style.border = "none";
            instrucao.style.cursor = "pointer";
            document.body.appendChild(instrucao);

            // Botão fechar
            const closeBtn = document.createElement('button');
            closeBtn.textContent = "Fechar";
            closeBtn.style.position = "fixed";
            closeBtn.style.top = "32px";
            closeBtn.style.right = "32px";
            closeBtn.style.zIndex = "10000";
            closeBtn.style.padding = "12px 24px";
            closeBtn.style.fontSize = "1.1rem";
            closeBtn.style.borderRadius = "18px";
            closeBtn.style.background = "#222";
            closeBtn.style.color = "#fff";
            closeBtn.style.border = "none";
            closeBtn.style.cursor = "pointer";
            closeBtn.onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(overlay);
                document.body.removeChild(closeBtn);
                document.body.removeChild(instrucao);
                responseArea.textContent = "";
            };

            document.body.appendChild(video);
            document.body.appendChild(closeBtn);

            // Troca para câmera frontal ao clicar
            instrucao.onclick = () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(overlay);
                document.body.removeChild(closeBtn);
                document.body.removeChild(instrucao);
                abrirCamera(true); // Abre a câmera frontal
            };

            speak(instrucao.textContent);

            video.onclick = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(video);
                document.body.removeChild(overlay);
                document.body.removeChild(closeBtn);
                document.body.removeChild(instrucao);

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
            };
        } catch (e) {
            responseArea.textContent = "Erro ao acessar a câmera.";
            listenBtn.style.display = "none";
        }
    }
});