import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

interface ParsedTransaction {
    reference: string;
    date: string;
    concept: string;
    amount_nio: number;
    amount_usd: number;
    is_payment: boolean;
    card_holder: string;
    card_last4: string;
}

export interface StatementInfo {
    account_number: string;
    client_name: string;
    credit_limit: string;
    cut_date: string;
    cut_year: number;
    payment_due_date: string;
    payment_due_nio: number;
    payment_due_usd: number;
    storage_path: string;
    transactions: ParsedTransaction[];
    totals: {
        purchases_nio: number;
        purchases_usd: number;
        payments_nio: number;
        payments_usd: number;
    };
}

@Injectable()
export class StatementParserService {
    private readonly logger = new Logger(StatementParserService.name);

    private readonly MONTH_MAP: Record<string, string> = {
        'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
    };

    constructor(private readonly supabaseService: SupabaseService) { }

    async parseStatement(buffer: Buffer, originalName: string, userId?: string): Promise<StatementInfo> {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const textResult = await parser.getText();
        const text = textResult.text;
        await parser.destroy();

        this.logger.log(`PDF parsed, ${text.length} characters extracted`);

        const cutYear = this.extractCutYear(text);
        const cutMonth = this.extractCutMonth(text);
        const accountNumber = this.extractField(text, /Número de cuenta\s+([^\n]+)/);
        const clientName = this.extractField(text, /Cliente\s+(.+?)(?:\n|Límite)/s);
        const creditLimit = this.extractField(text, /Límite de crédito\s+(\$[\d,.]+)/);
        const cutDate = this.extractField(text, /Fecha de corte\s+(.+?)(?:\n)/);
        const paymentDueDate = this.extractField(text, /Fecha límite para pagar\s+(.+?)(?:\n)/);

        let paymentDueNio = 0;
        let paymentDueUsd = 0;
        const pagoContadoLine = text.match(/Pago de contado\s+(.+?)(?:\n)/);
        if (pagoContadoLine) {
            const line = pagoContadoLine[1];
            const nioMatch = line.match(/C\$\s*([\d,.]+)/);
            if (nioMatch) paymentDueNio = parseFloat(nioMatch[1].replace(/,/g, ''));
            
            const usdMatch = line.match(/(?<!C)\$\s*([\d,.]+)/);
            if (usdMatch) paymentDueUsd = parseFloat(usdMatch[1].replace(/,/g, ''));
        }

        // Upload to Supabase Storage: statements/YYYY/MM/userId/uuid.pdf
        const uid = userId || 'anonymous';
        const storagePath = `statements/${cutYear}/${cutMonth}/${uid}/${uuidv4()}.pdf`;
        await this.uploadToStorage(buffer, storagePath, originalName);

        const transactions = this.extractTransactions(text, cutYear, cutMonth);

        const totals = {
            purchases_nio: 0,
            purchases_usd: 0,
            payments_nio: 0,
            payments_usd: 0,
        };

        for (const tx of transactions) {
            if (tx.is_payment) {
                totals.payments_nio += tx.amount_nio;
                totals.payments_usd += tx.amount_usd;
            } else {
                totals.purchases_nio += tx.amount_nio;
                totals.purchases_usd += tx.amount_usd;
            }
        }

        return {
            account_number: accountNumber,
            client_name: clientName?.trim() || '',
            credit_limit: creditLimit || '',
            cut_date: cutDate?.trim() || '',
            cut_year: cutYear,
            payment_due_date: paymentDueDate?.trim() || '',
            payment_due_nio: paymentDueNio,
            payment_due_usd: paymentDueUsd,
            storage_path: storagePath,
            transactions,
            totals,
        };
    }

    private async uploadToStorage(buffer: Buffer, path: string, originalName: string): Promise<void> {
        const client = this.supabaseService.getClient();
        
        try {
            const { error } = await client.storage
                .from('user-uploads')
                .upload(path, buffer, {
                    contentType: 'application/pdf',
                    upsert: false,
                });

            if (error) {
                this.logger.warn(`Error de almacenamiento (Supabase/S3): ${error.message}`);
            } else {
                this.logger.log(`Archivo almacenado correctamente en S3 Supabase: ${path}`);
            }
        } catch (error: any) {
            this.logger.warn(`Error interno subiendo a almacenamiento: ${error.message}`);
        }
    }

    private extractCutYear(text: string): number {
        const match = text.match(/Fecha de corte\s+\d+\/\d+\/(\d{2})/);
        if (match) {
            return 2000 + parseInt(match[1], 10);
        }
        return new Date().getFullYear();
    }

    private extractCutMonth(text: string): string {
        const match = text.match(/Fecha de corte\s+\d+\/(\d+)\/\d{2}/);
        if (match) {
            return match[1].padStart(2, '0');
        }
        return String(new Date().getMonth() + 1).padStart(2, '0');
    }

    private extractField(text: string, regex: RegExp): string {
        const match = text.match(regex);
        return match ? match[1].trim() : '';
    }

    private extractTransactions(text: string, year: number, cutMonth: string): ParsedTransaction[] {
        const transactions: ParsedTransaction[] = [];
        const lines = text.split('\n');

        let currentCardHolder = '';
        let currentCardLast4 = '';

        const cardPattern = /\*{4}-\*{4}-\*{4}-(\d{4})/;
        const holderPattern = /^([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s/]+)$/;

        // Match lines starting with digits (reference), then month/day, then rest
        const txPattern = /^(\d[\d\s]{10,}?)\s+([A-Z]{3})\/(\d{2})\s+(.+?)$/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            const cardMatch = line.match(cardPattern);
            if (cardMatch) {
                currentCardLast4 = cardMatch[1];
                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine && holderPattern.test(nextLine)) {
                        currentCardHolder = nextLine;
                        break;
                    }
                }
                continue;
            }

            if (line.startsWith('Número referencia') || line.startsWith('Saldo Anterior')) {
                continue;
            }

            const txMatch = line.match(txPattern);
            if (txMatch) {
                const reference = txMatch[1].trim();
                const monthAbbr = txMatch[2];
                const day = txMatch[3];
                const rest = txMatch[4];

                const monthNum = this.MONTH_MAP[monthAbbr];
                if (!monthNum) continue;

                // Adjust year automatically if the current transaction is from December
                // but the statement 'cut date' is in January of the following year
                let txYear = year;
                if (cutMonth === '01' && monthNum === '12') {
                    txYear = year - 1;
                } else if (cutMonth === '12' && monthNum === '01') {
                     // Just in case a December statement catches an early January tx (rare)
                    txYear = year + 1;
                }

                const dateStr = `${txYear}-${monthNum}-${day}`;

                const parsed = this.parseAmounts(rest);
                if (!parsed) continue;

                const isPayment = parsed.concept.includes('PAGO RECIBIDO') ||
                    parsed.concept.includes('BONIFICACION') ||
                    parsed.amountNio < 0 || parsed.amountUsd < 0;

                transactions.push({
                    reference,
                    date: dateStr,
                    concept: parsed.concept.trim(),
                    amount_nio: Math.abs(parsed.amountNio),
                    amount_usd: Math.abs(parsed.amountUsd),
                    is_payment: isPayment,
                    card_holder: currentCardHolder,
                    card_last4: currentCardLast4,
                });
            }
        }

        return transactions;
    }

    private parseAmounts(rest: string): { concept: string; amountNio: number; amountUsd: number } | null {
        let amountNio = 0;
        let amountUsd = 0;
        let concept = rest;

        // Try USD amount at end: $XX.XX or $XX.XX-
        const usdMatch = rest.match(/\$(\d[\d,]*\.\d{2})-?\s*$/);
        if (usdMatch) {
            const rawAmount = parseFloat(usdMatch[1].replace(/,/g, ''));
            amountUsd = usdMatch[0].includes('-') ? -rawAmount : rawAmount;
            concept = rest.substring(0, rest.lastIndexOf('$')).trim();

            const nioBeforeUsd = concept.match(/(\d[\d,]*\.\d{2})-?\s*$/);
            if (nioBeforeUsd) {
                const rawNio = parseFloat(nioBeforeUsd[1].replace(/,/g, ''));
                amountNio = nioBeforeUsd[0].includes('-') ? -rawNio : rawNio;
                concept = concept.substring(0, concept.length - nioBeforeUsd[0].length).trim();
            }

            return { concept, amountNio, amountUsd };
        }

        // Try NIO amount at end
        const nioMatch = rest.match(/(\d[\d,]*\.\d{2})-?\s*$/);
        if (nioMatch) {
            const rawAmount = parseFloat(nioMatch[1].replace(/,/g, ''));
            amountNio = nioMatch[0].trim().endsWith('-') ? -rawAmount : rawAmount;
            concept = rest.substring(0, rest.length - nioMatch[0].length).trim();
            return { concept, amountNio, amountUsd };
        }

        return null;
    }
}
