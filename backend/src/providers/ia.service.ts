import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

type Proveedor = 'gemini' | 'openrouter' | 'groq' | 'ollama' | 'anthropic';

// Proveedores que aceptan el formato de chat "compatible con OpenAI"
const COMPATIBLES: Record<
  Exclude<Proveedor, 'anthropic'>,
  { baseUrl: string; modelo: string; requiereClave: boolean }
> = {
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    // Medido en la capa gratuita (nov 2026): 3.5-flash-lite responde estable en 3-5 s;
    // el alias "latest" a veces tarda 20-40 s y los "flash" normales suelen estar saturados.
    // Si el primero falla o se demora, se intenta con el siguiente de la lista.
    modelo: 'gemini-3.5-flash-lite,gemini-flash-lite-latest',
    requiereClave: true,
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    // "openrouter/free" elige automáticamente un modelo gratuito disponible
    // (los modelos ":free" cambian seguido); Gemma queda como reserva.
    modelo: 'openrouter/free,google/gemma-4-31b-it:free',
    requiereClave: true,
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    modelo: 'llama-3.3-70b-versatile',
    requiereClave: true,
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    modelo: 'llama3.2',
    requiereClave: false,
  },
};

/**
 * Servicio compartido para hablar con un modelo de lenguaje.
 *
 * Se configura con variables de entorno:
 *   IA_PROVEEDOR  gemini | openrouter | groq | ollama | anthropic   (por defecto gemini)
 *   IA_API_KEY    clave del proveedor (Ollama no necesita)
 *   IA_MODEL      modelo a usar (opcional, cada proveedor tiene uno por defecto).
 *                 Acepta varios separados por coma: si uno está saturado se usa el siguiente.
 *   IA_BASE_URL   URL de la API (opcional, solo para proveedores compatibles con OpenAI)
 *   IA_TIMEOUT_MS tiempo máximo total de espera (por defecto 15000). Cada modelo de la
 *                 lista tiene como máximo 8 s, para que el siguiente alcance a responder.
 *
 * Si no hay clave, la llamada falla o tarda demasiado, devuelve null y cada
 * recomendador cae a su modo de respaldo por reglas: la demo nunca se cae.
 */
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly proveedor: Proveedor;
  private readonly apiKey: string;
  private readonly modelo: string;
  private modelos: string[] = [];
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly anthropic: Anthropic | null = null;
  private readonly disponible: boolean;

  constructor() {
    const proveedor = (process.env.IA_PROVEEDOR?.trim().toLowerCase() ||
      'gemini') as Proveedor;
    this.proveedor = [
      'gemini',
      'openrouter',
      'groq',
      'ollama',
      'anthropic',
    ].includes(proveedor)
      ? proveedor
      : 'gemini';
    this.timeoutMs = Number(process.env.IA_TIMEOUT_MS) || 15000;

    // Compatibilidad: si usan ANTHROPIC_API_KEY o GEMINI_API_KEY también se acepta
    this.apiKey = (
      process.env.IA_API_KEY ||
      (this.proveedor === 'anthropic' ? process.env.ANTHROPIC_API_KEY : '') ||
      (this.proveedor === 'gemini' ? process.env.GEMINI_API_KEY : '') ||
      (this.proveedor === 'openrouter' ? process.env.OPENROUTER_API_KEY : '') ||
      ''
    ).trim();

    if (this.proveedor === 'anthropic') {
      this.modelo = process.env.IA_MODEL?.trim() || 'claude-haiku-5-5';
      this.baseUrl = '';
      this.anthropic = this.apiKey
        ? new Anthropic({
            apiKey: this.apiKey,
            timeout: this.timeoutMs,
            maxRetries: 0,
          })
        : null;
      this.disponible = this.anthropic !== null;
    } else {
      const config = COMPATIBLES[this.proveedor];
      this.modelos = (process.env.IA_MODEL?.trim() || config.modelo)
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      this.modelo = this.modelos[0];
      this.baseUrl = (
        process.env.IA_BASE_URL?.trim() || config.baseUrl
      ).replace(/\/$/, '');
      this.disponible = !config.requiereClave || !!this.apiKey;
    }

    if (this.disponible) {
      this.logger.log(
        `IA activa: ${this.proveedor} (${this.modelos.length ? this.modelos.join(' → ') : this.modelo})`,
      );
    } else {
      this.logger.warn(
        `IA_API_KEY no configurada para "${this.proveedor}": los recomendadores usarán el modo respaldo.`,
      );
    }
  }

  estaDisponible(): boolean {
    return this.disponible;
  }

  /**
   * Pide al modelo una respuesta JSON que cumpla `schema` y la valida con
   * `validar`. Devuelve null ante cualquier problema.
   */
  async generarJson<T>(opciones: {
    sistema: string;
    mensaje: string;
    schema: Record<string, unknown>;
    validar: (dato: unknown) => T | null;
    maxTokens?: number;
    /** Plazo de esta llamada (ms). Por defecto IA_TIMEOUT_MS. */
    timeoutMs?: number;
  }): Promise<T | null> {
    if (!this.disponible) return null;

    const inicio = Date.now();
    try {
      const texto =
        this.proveedor === 'anthropic'
          ? await this.llamarAnthropic(opciones)
          : await this.llamarCompatible(opciones);
      if (texto === null) return null;

      const dato = this.extraerJson(texto);
      const validado = dato === undefined ? null : opciones.validar(dato);
      if (!validado) {
        this.logger.warn(
          `La respuesta de la IA no pasó la validación (${dato === undefined ? 'JSON inválido' : 'formato inesperado'}): ${texto.replace(/\s+/g, ' ').slice(0, 300)}`,
        );
        return null;
      }

      this.logger.log(
        `IA (${this.proveedor}) respondió en ${Date.now() - inicio} ms`,
      );
      return validado;
    } catch (error) {
      this.registrarError(error);
      return null;
    }
  }

  // ───────── Claude (SDK oficial, salidas estructuradas) ─────────
  private async llamarAnthropic(opciones: {
    sistema: string;
    mensaje: string;
    schema: Record<string, unknown>;
    maxTokens?: number;
  }): Promise<string | null> {
    const respuesta = await this.anthropic!.messages.create(
      {
        model: this.modelo,
        max_tokens: opciones.maxTokens ?? 2048,
        system: opciones.sistema,
        messages: [{ role: 'user', content: opciones.mensaje }],
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: opciones.schema },
        },
      },
      { timeout: this.timeoutMs },
    );

    if (respuesta.stop_reason === 'refusal') {
      this.logger.warn('El modelo rechazó la solicitud; se usa respaldo.');
      return null;
    }

    return respuesta.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }

  // ───────── Gemini / Groq / Ollama (API compatible con OpenAI) ─────────
  private async llamarCompatible(opciones: {
    sistema: string;
    mensaje: string;
    schema: Record<string, unknown>;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<string | null> {
    const sistema =
      `${opciones.sistema}\n\n` +
      'Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional ni bloques de código) ' +
      `que cumpla este JSON Schema:\n${JSON.stringify(opciones.schema)}`;

    // Plazo total IA_TIMEOUT_MS; cada modelo tiene como máximo 8 s, así si el
    // primero se queda pegado en la cola de la capa gratuita, el siguiente alcanza.
    const limite =
      Date.now() +
      Math.min(opciones.timeoutMs ?? this.timeoutMs, this.timeoutMs);

    for (const [i, modelo] of this.modelos.entries()) {
      const hayOtro = i < this.modelos.length - 1;
      const restante = limite - Date.now();
      if (restante < 1000) break;
      // el primero usa ~60% del plazo para que el de reserva tenga tiempo de responder
      const plazo = hayOtro
        ? Math.min(8000, Math.ceil(restante * 0.6))
        : restante;

      const controlador = new AbortController();
      const temporizador = setTimeout(() => controlador.abort(), plazo);
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controlador.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify({
            model: modelo,
            max_tokens: opciones.maxTokens ?? 2048,
            temperature: 0.2,
            messages: [
              { role: 'system', content: sistema },
              { role: 'user', content: opciones.mensaje },
            ],
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          return json.choices?.[0]?.message?.content ?? null;
        }

        const detalle = (await res.text()).slice(0, 200);
        if (res.status === 401 || res.status === 403) {
          this.logger.error(
            `IA_API_KEY inválida para ${this.proveedor}; se usa respaldo.`,
          );
          return null;
        }

        const motivo =
          res.status === 429
            ? 'alcanzó el límite de uso gratuito'
            : res.status === 404
              ? 'no está disponible (revisa IA_MODEL)'
              : res.status === 503
                ? 'está saturado'
                : `respondió HTTP ${res.status}`;
        this.logger.warn(
          `Modelo "${modelo}" ${motivo}; ${hayOtro ? 'se intenta con el siguiente' : 'se usa respaldo'}. ${detalle}`,
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.warn(
            `Modelo "${modelo}" tardó más de ${Math.round(plazo / 1000)} s; ${hayOtro ? 'se intenta con el siguiente' : 'se usa respaldo'}.`,
          );
          continue;
        }
        throw error;
      } finally {
        clearTimeout(temporizador);
      }
    }
    return null;
  }

  // Acepta JSON puro o envuelto en ```json … ``` o con texto alrededor
  private extraerJson(texto: string): unknown {
    const limpio = texto
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    try {
      return JSON.parse(limpio);
    } catch {
      const inicio = limpio.indexOf('{');
      const fin = limpio.lastIndexOf('}');
      if (inicio === -1 || fin <= inicio) return undefined;
      try {
        return JSON.parse(limpio.slice(inicio, fin + 1));
      } catch {
        return undefined;
      }
    }
  }

  private registrarError(error: unknown): void {
    if (error instanceof Error && error.name === 'AbortError') {
      this.logger.warn(
        `La IA tardó más de ${this.timeoutMs} ms; se usa respaldo.`,
      );
    } else if (error instanceof Anthropic.AuthenticationError) {
      this.logger.error('Clave de Claude inválida; se usa respaldo.');
    } else if (error instanceof Anthropic.RateLimitError) {
      this.logger.warn('Límite de uso de la IA alcanzado; se usa respaldo.');
    } else if (error instanceof Anthropic.APIConnectionTimeoutError) {
      this.logger.warn(
        `La IA tardó más de ${this.timeoutMs} ms; se usa respaldo.`,
      );
    } else if (error instanceof Anthropic.APIError) {
      this.logger.warn(`Error de la API de IA (${error.status}); respaldo.`);
    } else {
      this.logger.warn(`Fallo al consultar la IA: ${String(error)}`);
    }
  }
}
