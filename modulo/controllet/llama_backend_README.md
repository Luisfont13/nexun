# Backend IA Llama (Python)

## Requisitos
- Python 3.10+
- FastAPI
- Uvicorn
- Transformers (HuggingFace)

## Instalación
```bash
pip install -r requirements.txt
```

## Ejecución
```bash
uvicorn llama_backend:app --host 0.0.0.0 --port 8000
```

---

# Ejemplo de comando para lanzar el backend desde el root del proyecto
cd modulo/controllet && uvicorn llama_backend:app --host 0.0.0.0 --port 8000
