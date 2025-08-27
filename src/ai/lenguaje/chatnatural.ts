//crea una funcion para que el bot hable en lenguaje en natural usando esta clave y id de Zencoder que estan dentro de el .env ES EL TOKEN y la CLIENT-ID usalos para el modelo de ia
import axios from 'axios';

const ZENCODER_API_URL = 'https://api.zencoder.com/v2/';

export async function hablarEnLenguajeNatural(texto: string): Promise<string> {
    const response = await axios.post(`${ZENCODER_API_URL}/jobs`, {
        input: texto,
        output: 'string',
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.TOKEN}`,
            'Client-ID': process.env.CLIENT_ID,
        },
    });

    return response.data.output;
}
