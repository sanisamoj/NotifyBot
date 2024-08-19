import { WeatherResponse } from "./WeatherResponse"

export interface WeatherResultResponse {
    city: string
    forecast: WeatherResponse[]
}