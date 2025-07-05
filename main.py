from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import requests
import os
import base64
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")   # Substitua pela sua chave real

if not GEMINI_API_KEY:
    raise RuntimeError("🔐 A variável de ambiente GEMINI_API_KEY não foi definida.")

# Para endpoints de texto/chat:
GEMINI_TEXT_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={GEMINI_API_KEY}"

# Para endpoints de imagem:
GEMINI_VISION_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={GEMINI_API_KEY}"

app = FastAPI(title="VIVA Vision API", version="2.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de requisição
class ChatRequest(BaseModel):
    pergunta: str
    usuario: str = "default"

class ImageRequest(BaseModel):
    image: str  # base64 string

class ChatResponse(BaseModel):
    resposta: str

# Histórico de conversas (em memória)
conversas: Dict[str, List[Dict]] = {}

@app.get("/")
async def root():
    return {
        "message": "API VIVA Vision com Gemini",
        "version": "2.0.0",
        "endpoints": {
            "chat": "/chat - POST - Perguntas para o assistente",
            "analisar-imagem": "/analisar-imagem - POST - Análise de imagem base64",
            "health": "/health - GET - Status da API"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API funcionando corretamente"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    pergunta = request.pergunta.strip()
    usuario = request.usuario

    # Recupera ou cria histórico
    if usuario not in conversas:
        conversas[usuario] = [
            {
                "role": "user",
                "parts": [{
                    "text": "Você é o VIVA, um assistente acessível para pessoas com deficiência visual. Responda de forma clara, objetiva e amigável."
                }]
            }
        ]

    conversas[usuario].append({"role": "user", "parts": [{"text": pergunta}]})

    try:
        response = requests.post(
            GEMINI_TEXT_URL,
            headers={"Content-Type": "application/json"},
            json={"contents": conversas[usuario]}
        )

        if response.status_code != 200:
            raise Exception(f"Erro {response.status_code}: {response.text}")

        resposta_modelo = response.json()
        resposta_texto = resposta_modelo["candidates"][0]["content"]["parts"][0]["text"]

        conversas[usuario].append({"role": "model", "parts": [{"text": resposta_texto}]})

        return ChatResponse(resposta=resposta_texto)

    except Exception as e:
        print("❌ Erro ao chamar Gemini:", str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@app.post("/analisar-imagem")
async def analisar_imagem(image_request: ImageRequest):
    try:
        # Remove prefixo se existir
        if "," in image_request.image:
            image_data = image_request.image.split(",")[1]
        else:
            image_data = image_request.image

        # Monta payload para Gemini Vision
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": "Descreva a imagem de forma acessível e objetiva para uma pessoa com deficiência visual. nao utilize asteriscos ou emojis, apenas texto claro e direto."
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_data
                            }
                        }
                    ]
                }
            ]
        }

        response = requests.post(
            GEMINI_VISION_URL,
            headers={"Content-Type": "application/json"},
            json=payload
        )

        if response.status_code != 200:
            raise Exception(f"Erro {response.status_code}: {response.text}")

        resposta_modelo = response.json()
        resposta_texto = resposta_modelo["candidates"][0]["content"]["parts"][0]["text"]

        return {"caption": resposta_texto}

    except Exception as e:
        print("❌ Erro ao analisar imagem:", str(e))
        raise HTTPException(status_code=500, detail="Erro ao analisar imagem")