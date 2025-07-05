// File: /viva-mobile-frontend/viva-mobile-frontend/src/js/main.js

document.addEventListener("DOMContentLoaded", function() {
    const API_URL = "http://localhost:8000"; // ajuste se necessário

    const micBtn = document.getElementById('mic-button');
    const cameraBtn = document.getElementById('camera-button');
    const cancelBtn = document.getElementById('cancel-button');
    const userInput = document.getElementById('user-input');
    const responseArea = document.getElementById('response-area');

    // Fala (Speech Synthesis)
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
            recognition.start();
            micBtn.classList.add('active');
        });
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            micBtn.classList.remove('active');
            sendPergunta(); // envia automaticamente ao terminar de falar
        };
        recognition.onend = () => micBtn.classList.remove('active');
        recognition.onerror = () => micBtn.classList.remove('active');
    } else {
        micBtn.disabled = true;
        micBtn.title = "Reconhecimento de voz não suportado";
    }

    // Envio automático ao pressionar Enter
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendPergunta();
        }
    });

    async function sendPergunta() {
        const pergunta = userInput.value.trim();
        if (!pergunta) return;
        responseArea.textContent = "Pensando...";
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pergunta })
            });
            const data = await res.json();
            responseArea.textContent = data.resposta || "Sem resposta.";
            speak(data.resposta || "");
        } catch (e) {
            responseArea.textContent = "Erro ao conectar ao assistente.";
        }
    }

    // Botão cancelar: limpa tudo e cancela fala/voz
    cancelBtn.addEventListener('click', () => {
        userInput.value = "";
        responseArea.textContent = "";
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (recognition && recognition.abort) recognition.abort();
    });

    // Captura de imagem e envio para API
    cameraBtn.addEventListener('click', async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            responseArea.textContent = "Câmera não suportada neste dispositivo.";
            return;
        }
        responseArea.textContent = "Aguardando foto...";
        cameraBtn.classList.add('active');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            // Captura frame
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Para a câmera
            stream.getTracks().forEach(track => track.stop());

            // Envia para API
            const base64 = canvas.toDataURL('image/jpeg');
            responseArea.textContent = "Analisando imagem...";
            const res = await fetch(`${API_URL}/analisar-imagem`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64 })
            });
            const data = await res.json();
            responseArea.textContent = data.caption || "Sem descrição.";
            speak(data.caption || "");
        } catch (e) {
            responseArea.textContent = "Erro ao acessar a câmera.";
        }
        cameraBtn.classList.remove('active');
    });
});