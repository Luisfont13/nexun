from fastapi import FastAPI, Request
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
import uvicorn
import os


# Configuración de modelo y dispositivo
MODEL_NAME = os.environ.get("LLAMA_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

try:
    print(f"Cargando modelo {MODEL_NAME} en {DEVICE}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32
    ).to(DEVICE)
    generator = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        device=0 if DEVICE == "cuda" else -1
    )
    print("Modelo cargado correctamente.")
except Exception as e:
    print(f"[ERROR] No se pudo cargar el modelo: {e}")
    generator = None

app = FastAPI()

class GenRequest(BaseModel):
    prompt: str
    options: dict = {}


@app.post("/v1/generate")
async def generate(req: GenRequest):
    if generator is None:
        return {"text": "[ERROR] El modelo no está disponible."}
    prompt = req.prompt
    opts = req.options or {}
    max_tokens = int(opts.get("maxTokens", 128))
    temperature = float(opts.get("temperature", 0.7))
    top_k = int(opts.get("topK", 50))
    top_p = float(opts.get("topP", 0.95))
    try:
        out = generator(
            prompt,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_k=top_k,
            top_p=top_p
        )
        # HuggingFace pipeline puede devolver el prompt + respuesta concatenados
        text = out[0]["generated_text"]
        if text.startswith(prompt):
            text = text[len(prompt):].strip()
        # Logging opcional
        print(f"[LLAMA] Prompt: {prompt}\n[LLAMA] Respuesta: {text}")
        return {"text": text}
    except Exception as e:
        print(f"[ERROR] Llama inference: {e}")
        return {"text": f"[ERROR] {e}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
