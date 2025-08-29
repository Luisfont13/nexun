import axios from 'axios';
require('dotenv').config();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

export async function hablarEnLenguajeNatural(texto: string): Promise<string> {
  try {
    const res = await axios.post(GEMINI_API_URL + `?key=${process.env.GEMINI_API_KEY}`, {
      contents: [
        {
          parts: [{ text: texto }]
        }
      ],
      generationConfig: {
        temperature: 0.16, // Más precisión, menos aleatorio
        topP: 0.5,
        topK: 1,
        maxOutputTokens: 5 // Limita la longitud de la respuesta
      }
    });

    let respuesta = res.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta de Gemini.';
    // Filtrar respuestas repetitivas o muy genéricas
    if (respuesta.trim().toLowerCase() === texto.trim().toLowerCase()) {
      return 'No tengo información relevante para eso.';
    }
    // Limitar a 2 líneas como máximo
    respuesta = respuesta.split('\n').slice(0, 2).join(' ');
    // Limitar a 200 caracteres
    if (respuesta.length > 200) respuesta = respuesta.slice(0, 200) + '...';
    return respuesta;
  } catch (e) {
    return 'Error consultando Gemini.';
  }
}

(async () => {
  try {
    const res = await axios.post(GEMINI_API_URL + `?key=${process.env.GEMINI_API_KEY}`, {
      contents: [
        {
          parts: [{ text: 'Hola, ¿funcionas?' }]
        }
      ]
    });
    console.log(res.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
})();
