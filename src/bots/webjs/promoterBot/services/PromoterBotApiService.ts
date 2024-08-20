import axios, { AxiosInstance, AxiosResponse } from "axios"
import fs from 'fs'
import * as dotenv from 'dotenv'
import { AddressResponse } from "../data/interfaces/AddresResponse"
import { WeatherResultResponse } from "../data/interfaces/WeatherResultResponse"
import path from 'path'
dotenv.config()

export class PromoterBotApiService {
    
    private api: AxiosInstance

    constructor() {
        this.api = axios.create()
    }

    async cep(cep: string): Promise<string> {
        const apiUrl: string = `https://brasilapi.com.br/api/cep/v1/${cep}`
        const response: AxiosResponse<AddressResponse> = await this.api.get(apiUrl)

        const address = response.data
        return `*Cep pesquisado:* ${address.cep}\n` +
               `*Rua:* _${address.street}_\n` +
               `*Bairro:* _${address.neighborhood}_\n` +
               `*Cidade:* _${address.city}_\n` +
               `*Estado:* _${address.state}_`;
    }

    async everyDayWeather(message_city: string): Promise<string> {
        const city: string = message_city.slice(7).toLowerCase() || "São Paulo"
        const apiUrl: string = `https://api.hgbrasil.com/weather?key=${process.env.API_KEY_CLIMA}&city_name=${city}`
        
        const response: AxiosResponse<any> = await this.api.get(apiUrl)
        const data: WeatherResultResponse = response.data.results
        
        const forecastMessages: string = data.forecast.slice(0, 7).map((item) => 
            `*_Data:_* _${item.date}_\n*_Dia da semana:_* _${item.weekday}_\n*_Max. do dia:_* _${item.max}ºc_ / *_Min. do dia:_* _${item.min}ºc_\n*_Probabilidade de chuva:_* _${item.rain_probability}%_\n*_Condição do dia:_* _"${item.description}"_\n\n`
        ).join('')
        
        return `*_Cidade de referência:_* _${data.city}_\n*Clima para os próximos* *_7 dias:_*\n\n` + forecastMessages
    }

    async apiWeather(): Promise<string> {
        const apiUrl: string = `https://api.hgbrasil.com/weather?key=${process.env.API_KEY_CLIMA}`
        
        const response: AxiosResponse<any> = await this.api.get(apiUrl)
        const data: WeatherResultResponse = response.data.results

        return `_A temperatura atual é *${response.data.results.temp}ºc*, com mín. de *${data.forecast[0].min}ºc* e max de *${data.forecast[0].max}ºc*_.\n` +
               `_*${data.forecast[0].description}*, com *${data.forecast[0].rain_probability}%* de chuva._\n` +
               `*_Cidade de referência é São Paulo_*`
    }

    async sendSticker(): Promise<string> {
        const filePath: string = path.join(__dirname, "..", "/stickers")
        const stickers: string[] = fs.readdirSync(filePath)
        return stickers[Math.floor(Math.random() * stickers.length)]
    }

    contextText(mensagemAnormalized: string): string {
        console.log(mensagemAnormalized)
        const normalizedMessage = mensagemAnormalized.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase()

        const messageMap = new Map<string, string[]>([
            ['SAIR', ['Boa, to pensando sair hoje tbm', 'Vai sair né?!', 'Nem falou que ia sair, tava querendo também....']],
            ['KK', ['Boa, kkkkkk', 'kkkkkk', 'Não entendi kkkkk', 'kkkkk besta']],
            ['QUERO', ['Eu também quero', 'Querer não é poder!', 'Eu também quero, mas querer não é poder!']],
            ['LEGAL', ['Legal mesmo', 'Tbm achei', 'Será?', 'Legal? Será?', 'Mas não seria melhor o que é ilegal? kkkk parei']],
            ['SIM', ['Concordo', 'Tbm concordo', 'Será?', 'Tbm acho']],
            ['VAMOS', ['Bora', 'Vou tbm', 'Eu queria ir, mas tenho que ficar vendo os grupos']],
            ['PIX', ['Tá com dinheiro né....', 'Pagamento já caiu?', 'Divide com os pobres esse dinheiro todo ai']],
            ['LINK', ['Eu nem entro nessas coisas pq pode ser vírus', 'Nem vou entrar pq não confio em vc', 'Tenho pavor de link']]
        ]);

        for (const [key, messages] of messageMap) {
            if (normalizedMessage.includes(key)) {
                return messages[Math.floor(Math.random() * messages.length)]
            }
        }

        return "Não consegui entender a mensagem."
    }

    async apiNews(news: string): Promise<any> {
        const tema = news || "politica brasileira";
        const apikey = process.env.API_KEY_NEWS;
        const arrayNews: any[] = [];
        
        if (!apikey) {
            throw new Error("API key not found.");
        }
    
        const apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(tema.toLowerCase())}&from=${this.getFormattedDate()}&to=${this.getFormattedDate()}&language=pt&sortBy=publishedAt&apiKey=${apikey}`;
        const api: AxiosInstance = axios.create();
    
        try {
            const response = await api.get(apiUrl);
            arrayNews.push(response.data);
        } catch (error) {
            console.error("Error fetching news:", error);
            throw new Error("Failed to fetch news.");
        }
    
        if (arrayNews[0]?.totalResults) {
            const articleSelected = arrayNews[0].articles[Math.floor(Math.random() * arrayNews[0].articles.length)];
            return this.formatResponse(tema, articleSelected);
        } else {
            return {
                txt: "*Desculpa, não achei nada com o título pesquisado.*\n_Tenta pesquisar o título de uma forma diferente ex :_\n*_/notícias Crimes_*\n*_/notícias Política internacional_*",
                linkImg: null
            };
        }
    }

    private getFormattedDate(): string {
        const date = new Date()
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear().toString()
        return `${year}/${month}/${day}`
    }
    
    private formatResponse(tema: string, article: any): any {
        const title = article.title ? `*${article.title}*` : `*${tema.toUpperCase()}*`
        const description = article.description || "Sem descrição disponível."
        const url = article.url || "Link não disponível."
        const linkImg = article.urlToImage || null
    
        const txt = `${title}\n\nResumo: ${description}\n\n_link para a publicação completa: ${url}_`
        return { txt, linkImg }
    }
}