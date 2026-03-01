import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);
    // Cache map: 'YYYY-MM-DD' -> rate
    private rateCache = new Map<string, number>();

    // Hardcode a fallback just in case the API is completely unreachable
    private readonly FALLBACK_RATE = 36.6243;

    private getTodayString(): string {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async getTodayRate(): Promise<number> {
        const todayStr = this.getTodayString();

        if (this.rateCache.has(todayStr)) {
            return this.rateCache.get(todayStr) as number;
        }

        const d = new Date();
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();

        // BCN SOAP envelope
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <RecuperaTC_Dia xmlns="http://servicios.bcn.gob.ni/">
      <Ano>${year}</Ano>
      <Mes>${month}</Mes>
      <Dia>${day}</Dia>
    </RecuperaTC_Dia>
  </soap:Body>
</soap:Envelope>`;

        try {
            const response = await axios.post(
                'https://servicios.bcn.gob.ni/Tc_Servicio/ServicioTC.asmx',
                xmlBody,
                {
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                        'SOAPAction': 'http://servicios.bcn.gob.ni/RecuperaTC_Dia'
                    },
                    timeout: 5000
                }
            );

            // Parse response
            const parser = new XMLParser();
            const jsonObj = parser.parse(response.data);

            const rateStr = jsonObj['soap:Envelope']['soap:Body']['RecuperaTC_DiaResponse']['RecuperaTC_DiaResult'];
            const rate = parseFloat(rateStr);

            if (isNaN(rate)) throw new Error('Parsed rate is NaN');

            this.rateCache.set(todayStr, rate);
            this.logger.log(`Fetched current BCN exchange rate: ${rate}`);
            return rate;
        } catch (error) {
            this.logger.error(`Failed to fetch exchange rate: ${error.message}. Using fallback.`);
            // Use last cached rate globally or fallback
            let fallback = this.FALLBACK_RATE;
            const keys = Array.from(this.rateCache.keys()).sort().reverse();
            if (keys.length > 0) {
                fallback = this.rateCache.get(keys[0]) as number;
            }
            // Do not cache the fallback for today, so we can retry later if called again.
            return fallback;
        }
    }

    async convert(amount: number, from: 'NIO' | 'USD', to: 'NIO' | 'USD'): Promise<{ result: number, rate: number }> {
        if (from === to) return { result: amount, rate: 1 };

        const rate = await this.getTodayRate();

        let result = amount;
        if (from === 'USD' && to === 'NIO') {
            result = amount * rate;
        } else if (from === 'NIO' && to === 'USD') {
            result = amount / rate;
        }

        return {
            result: parseFloat(result.toFixed(4)),
            rate
        };
    }
}
