import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EstadoReserva,
  ReservaEntity,
} from '../database/entities/reserva.entity';
import {
  EstadoSala,
  SalaEntity,
  UbicacionSala,
} from '../database/entities/sala.entity';
import { IaService } from './ia.service';
import { LibraryAccessService } from './library-access.service';
import { ReserveRoomService } from './reserve-room.service';

// Horario de cada bloque (mismo que usa ReserveRoomService)
const BLOQUES: Record<number, { letra: string; inicio: string; fin: string }> =
  {
    1: { letra: 'A', inicio: '08:00', fin: '09:00' },
    2: { letra: 'B', inicio: '09:00', fin: '10:00' },
    3: { letra: 'C', inicio: '10:00', fin: '11:00' },
    4: { letra: 'D', inicio: '11:00', fin: '12:00' },
    5: { letra: 'E', inicio: '12:00', fin: '13:00' },
    6: { letra: 'F', inicio: '13:00', fin: '14:00' },
    7: { letra: 'G', inicio: '14:00', fin: '15:00' },
    8: { letra: 'H', inicio: '15:00', fin: '16:00' },
    9: { letra: 'I', inicio: '16:00', fin: '17:00' },
    10: { letra: 'J', inicio: '17:00', fin: '18:00' },
    11: { letra: 'K', inicio: '18:00', fin: '19:00' },
  };

const UBICACIONES: Record<number, string> = {
  [UbicacionSala.BIBLIOTECA]: 'Biblioteca',
  [UbicacionSala.AULARIO_A]: 'Aulario A',
  [UbicacionSala.AULARIO_C]: 'Aulario C',
  [UbicacionSala.CAFETERIA_A]: 'Cafetería A',
  [UbicacionSala.CAFETERIA_B]: 'Cafetería B',
  [UbicacionSala.AUDITORIO_INF]: 'Auditorio INF',
};

// Criterios estructurados que se extraen de la consulta
export interface CriteriosSala {
  personas: number | null;
  bloques: number[];
  ubicaciones: number[];
  preferirBajaDemanda: boolean;
  // idSala → 0..100: cuánto calza la descripción de la sala con lo pedido
  // (equipamiento, ambiente, uso). Vacío si el estudiante no pidió nada de eso.
  afinidad: Record<number, number>;
}

export interface RecomendacionSala {
  idSala: number;
  nombreSala: string;
  capacidad: number;
  ubicacion: string;
  descripcion: string | null;
  bloque: number;
  bloqueLetra: string;
  inicio: string;
  fin: string;
  puntaje: number;
  motivo: string;
  reservasHistoricas: number;
}

export interface RespuestaRecomendacionSalas {
  modo: 'ia' | 'respaldo';
  consulta: string;
  fecha: string;
  criterios: {
    personas: number | null;
    bloques: string[];
    ubicaciones: string[];
    preferirBajaDemanda: boolean;
  };
  explicacion: string;
  avisos: string[];
  recomendaciones: RecomendacionSala[];
}

const SCHEMA_CRITERIOS = {
  type: 'object',
  properties: {
    personas: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    bloques: { type: 'array', items: { type: 'integer' } },
    ubicaciones: { type: 'array', items: { type: 'integer' } },
    preferirBajaDemanda: { type: 'boolean' },
    afinidad: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idSala: { type: 'integer' },
          puntos: { type: 'integer' },
        },
        required: ['idSala', 'puntos'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'personas',
    'bloques',
    'ubicaciones',
    'preferirBajaDemanda',
    'afinidad',
  ],
  additionalProperties: false,
};

// Palabras que no sirven para comparar la consulta con la descripción
const PALABRAS_VACIAS = new Set(
  'para con una unos unas que los las del por sala salas necesito quiero busco algo donde este esta hoy tarde manana personas somos estudiar estudio hacer tener tiene sea como mas muy poder puedo podamos vamos'.split(
    ' ',
  ),
);

const SCHEMA_EXPLICACION = {
  type: 'object',
  properties: {
    explicacion: { type: 'string' },
    motivos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idSala: { type: 'integer' },
          bloque: { type: 'integer' },
          motivo: { type: 'string' },
        },
        required: ['idSala', 'bloque', 'motivo'],
        additionalProperties: false,
      },
    },
  },
  required: ['explicacion', 'motivos'],
  additionalProperties: false,
};

@Injectable()
export class RecomendadorSalasService {
  constructor(
    @InjectRepository(SalaEntity)
    private readonly salaRepository: Repository<SalaEntity>,
    @InjectRepository(ReservaEntity)
    private readonly reservaRepository: Repository<ReservaEntity>,
    private readonly reserveRoomService: ReserveRoomService,
    private readonly libraryAccessService: LibraryAccessService,
    private readonly iaService: IaService,
  ) {}

  async recomendar(
    consulta: string,
    usuarioId: number,
  ): Promise<RespuestaRecomendacionSalas> {
    // Reglas de negocio existentes: estudiante activo y sin multas impagas
    await this.libraryAccessService.validateAcademicStatus(usuarioId);
    await this.libraryAccessService.validateNoPendingFines(usuarioId);

    const ahora = this.ahoraSantiago();
    const avisos: string[] = [];

    // Solo se consideran salas habilitadas para reservar
    const salas = await this.salaRepository.find({
      where: { estado: EstadoSala.DISPONIBLE },
    });

    // ── Paso 1: PLN → criterios estructurados (IA o reglas) ──
    let modo: 'ia' | 'respaldo' = 'respaldo';
    let criterios = await this.extraerCriteriosIa(consulta, ahora.hora, salas);
    if (criterios) {
      modo = 'ia';
    } else {
      criterios = this.extraerCriteriosRespaldo(consulta, ahora.hora, salas);
    }

    // Solo se reserva para hoy: se descartan los bloques que ya terminaron
    const bloquesRestantes = Object.keys(BLOQUES)
      .map(Number)
      .filter((b) => BLOQUES[b].fin > ahora.hora);

    let bloquesBuscados = criterios.bloques.filter((b) =>
      bloquesRestantes.includes(b),
    );
    if (criterios.bloques.length > 0 && bloquesBuscados.length === 0) {
      avisos.push(
        'Los horarios que pediste ya pasaron hoy; te muestro los próximos bloques disponibles.',
      );
    }
    if (bloquesBuscados.length === 0) bloquesBuscados = bloquesRestantes;

    if (bloquesRestantes.length === 0) {
      avisos.push(
        'Ya no quedan bloques disponibles hoy (las reservas son solo para el día actual).',
      );
    }

    // ── Paso 2: filtrar salas libres y asignar puntaje ──
    const recomendaciones = await this.puntuar(
      criterios,
      bloquesBuscados,
      ahora.fecha,
      salas,
    );

    // La ubicación pedida no tiene salas libres que sirvan: se avisa en vez de
    // decir "cerca de X" mientras se recomiendan salas en otro lugar
    const nombresUbicacion = criterios.ubicaciones.map((u) => UBICACIONES[u]);
    const hayEnUbicacion = recomendaciones.some((r) =>
      nombresUbicacion.includes(r.ubicacion),
    );
    if (
      nombresUbicacion.length > 0 &&
      recomendaciones.length > 0 &&
      !hayEnUbicacion
    ) {
      avisos.push(
        `En ${nombresUbicacion.join(' / ')} no hay salas libres${criterios.personas ? ` para ${criterios.personas} personas` : ''} en esos horarios; te muestro las mejores alternativas en otras ubicaciones.`,
      );
      criterios = { ...criterios, ubicaciones: [] }; // la explicación no dirá "cerca de X"
    }

    if (recomendaciones.length === 0 && bloquesRestantes.length > 0) {
      avisos.push(
        criterios.personas
          ? `No encontré salas libres para ${criterios.personas} personas en esos bloques.`
          : 'No encontré salas libres en esos bloques.',
      );
    }

    // ── Paso 3: explicación (IA si está disponible, si no, plantilla) ──
    let explicacion = this.explicacionRespaldo(criterios, recomendaciones);
    if (modo === 'ia' && recomendaciones.length > 0) {
      const redaccion = await this.redactarConIa(
        consulta,
        criterios,
        recomendaciones,
      );
      if (redaccion) {
        explicacion = redaccion.explicacion;
        for (const r of recomendaciones) {
          const m = redaccion.motivos.find(
            (x) => x.idSala === r.idSala && x.bloque === r.bloque,
          );
          if (m?.motivo) r.motivo = m.motivo;
        }
      }
    }

    return {
      modo,
      consulta,
      fecha: ahora.fecha,
      criterios: {
        personas: criterios.personas,
        bloques: criterios.bloques.map((b) => BLOQUES[b].letra),
        ubicaciones: nombresUbicacion, // lo que pidió el estudiante
        preferirBajaDemanda: criterios.preferirBajaDemanda,
      },
      explicacion,
      avisos,
      recomendaciones,
    };
  }

  // ───────────────────────── Paso 1 · IA ─────────────────────────

  private async extraerCriteriosIa(
    consulta: string,
    horaActual: string,
    salas: SalaEntity[],
  ): Promise<CriteriosSala | null> {
    if (!this.iaService.estaDisponible()) return null;

    const tablaSalas = salas
      .map(
        (s) =>
          `${s.idSala} = ${s.nombreSala} (${s.capacidad} personas, ${UBICACIONES[s.ubicacion] ?? 'sin ubicación'}): ${s.descripcion?.trim() || 'sin descripción'}`,
      )
      .join('\n');

    const tablaBloques = Object.entries(BLOQUES)
      .map(([n, b]) => `${n} = bloque ${b.letra} (${b.inicio}-${b.fin})`)
      .join('\n');
    const tablaUbicaciones = Object.entries(UBICACIONES)
      .map(([n, u]) => `${n} = ${u}`)
      .join('\n');

    const sistema = `Eres el asistente de reservas de salas de estudio de una biblioteca universitaria en Chile.
Tu tarea es convertir lo que escribe un estudiante en criterios de búsqueda estructurados.
Las reservas son solo para HOY. Hora actual: ${horaActual}.

Bloques horarios (usa el número):
${tablaBloques}

Ubicaciones de las salas (usa el número):
${tablaUbicaciones}

Reglas:
- personas: cantidad de personas que usarán la sala, o null si no se menciona. "solo/sola/individual" = 1, "en pareja" = 2.
- bloques: números de los bloques que calzan con lo pedido. "mañana" (en la mañana) = 1-4, "mediodía/almuerzo" = 5-6, "tarde" = 6-10, "última hora/noche" = 10-11, "ahora/lo antes posible" = el bloque actual y el siguiente. Una hora concreta = el bloque que la contiene. Si no se menciona horario, lista vacía.
- ubicaciones: números de las ubicaciones pedidas ("cafetería" = 4 y 5; "aulario" sin letra = 2 y 3). Lista vacía si no importa.
- preferirBajaDemanda: true si pide un lugar tranquilo, silencioso, con poca gente o poco concurrido.
- afinidad: compara lo que el estudiante quiere hacer o necesita (equipamiento como pizarra, proyector, pantalla, enchufes o computadores; ambiente como silencio o luz natural; usos como ensayar una presentación, estudiar en grupo o tener una reunión) con la DESCRIPCIÓN de cada sala. Para cada sala cuya descripción tenga relación, devuelve su idSala y puntos de 0 a 100 (100 = calza perfecto). Omite las salas sin relación. Si el estudiante no pide nada de equipamiento, ambiente ni uso, devuelve lista vacía. No uses capacidad ni ubicación para la afinidad: eso ya se evalúa aparte.

Salas habilitadas (idSala = nombre (capacidad, ubicación): descripción):
${tablaSalas}`;

    const idsSalas = new Set(salas.map((s) => s.idSala));
    return this.iaService.generarJson<CriteriosSala>({
      sistema,
      mensaje: consulta,
      schema: SCHEMA_CRITERIOS,
      maxTokens: 1024,
      // la consulta completa (2 llamadas + base de datos) debe quedar bajo ~15 s
      timeoutMs: 9000,
      validar: (dato) => this.validarCriterios(dato, idsSalas),
    });
  }

  // Valida y normaliza la salida del modelo (nunca se confía a ciegas)
  private validarCriterios(
    dato: unknown,
    idsSalas: Set<number>,
  ): CriteriosSala | null {
    if (!dato || typeof dato !== 'object') return null;
    const d = dato as Record<string, unknown>;

    const personas =
      typeof d.personas === 'number' && d.personas >= 1 && d.personas <= 200
        ? Math.round(d.personas)
        : null;
    const bloques = Array.isArray(d.bloques)
      ? [...new Set(d.bloques.map(Number))].filter((b) => BLOQUES[b])
      : [];
    const ubicaciones = Array.isArray(d.ubicaciones)
      ? [...new Set(d.ubicaciones.map(Number))].filter((u) => UBICACIONES[u])
      : [];

    // afinidad: solo salas reales y puntos entre 0 y 100
    const afinidad: Record<number, number> = {};
    if (Array.isArray(d.afinidad)) {
      for (const item of d.afinidad as Record<string, unknown>[]) {
        const id = Number(item?.idSala);
        const puntos = Number(item?.puntos);
        if (idsSalas.has(id) && Number.isFinite(puntos)) {
          afinidad[id] = Math.max(0, Math.min(100, Math.round(puntos)));
        }
      }
    }

    return {
      personas,
      bloques: bloques.sort((a, b) => a - b),
      ubicaciones,
      preferirBajaDemanda: d.preferirBajaDemanda === true,
      afinidad,
    };
  }

  // ─────────────────────── Paso 1 · respaldo ───────────────────────

  extraerCriteriosRespaldo(
    consulta: string,
    horaActual: string,
    salas: SalaEntity[] = [],
  ): CriteriosSala {
    const texto = this.normalizar(consulta);

    // personas
    const numeros: Record<string, number> = {
      un: 1,
      una: 1,
      uno: 1,
      dos: 2,
      tres: 3,
      cuatro: 4,
      cinco: 5,
      seis: 6,
      siete: 7,
      ocho: 8,
      nueve: 9,
      diez: 10,
      once: 11,
      doce: 12,
      quince: 15,
      veinte: 20,
      treinta: 30,
    };
    let personas: number | null = null;
    const matchNum = texto.match(
      /(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|treinta)\s*(personas?|integrantes?|estudiantes?|companer[oa]s?|alumn[oa]s?|amig[oa]s?|pers\b|somos)/,
    );
    const matchSomos = texto.match(/somos\s+(\d+|[a-z]+)/);
    const valor = matchNum?.[1] ?? matchSomos?.[1];
    if (valor)
      personas = /^\d+$/.test(valor) ? Number(valor) : (numeros[valor] ?? null);
    if (personas === null && /\b(solo|sola|individual|yo mismo)\b/.test(texto))
      personas = 1;
    if (personas === null && /\bpareja\b/.test(texto)) personas = 2;

    // bloques
    const bloques = new Set<number>();
    const rango = (a: number, b: number) => {
      for (let i = a; i <= b; i++) bloques.add(i);
    };
    const matchBloque = texto.match(/bloque\s+([a-k])\b/);
    if (matchBloque) {
      const n = Object.entries(BLOQUES).find(
        ([, b]) => b.letra.toLowerCase() === matchBloque[1],
      );
      if (n) bloques.add(Number(n[0]));
    }
    const matchHora =
      texto.match(/(?:a las|las|desde las)\s*(\d{1,2})(?::\d{2})?/) ??
      texto.match(/\b(\d{1,2}):\d{2}\b/);
    if (matchHora) {
      let h = Number(matchHora[1]);
      if (h >= 1 && h <= 7 && /tarde/.test(texto)) h += 12; // "a las 3 de la tarde"
      const bloque = h - 7; // 8:00 → bloque 1
      if (BLOQUES[bloque]) bloques.add(bloque);
    }
    if (bloques.size === 0) {
      if (/(en la|por la|esta|temprano en la) manana|\btemprano\b/.test(texto))
        rango(1, 4);
      if (/mediodia|almuerzo|hora de almuerzo/.test(texto)) rango(5, 6);
      if (/tarde/.test(texto)) rango(6, 10);
      if (/noche|ultima hora|al final del dia/.test(texto)) rango(10, 11);
      if (
        /\b(ahora|ya mismo|lo antes posible|altiro|urgente|de inmediato)\b/.test(
          texto,
        )
      ) {
        const actual = Object.keys(BLOQUES)
          .map(Number)
          .find((b) => BLOQUES[b].fin > horaActual);
        if (actual) {
          bloques.add(actual);
          if (BLOQUES[actual + 1]) bloques.add(actual + 1);
        }
      }
      // "manana" sola es ambigua (también es "tomorrow"); como solo se reserva hoy,
      // la interpretamos como horario de mañana si aún no se detectó otro horario
      if (bloques.size === 0 && /\bmanana\b/.test(texto)) rango(1, 4);
    }

    // ubicaciones
    const ubicaciones = new Set<number>();
    if (/cafeteria\s*a\b/.test(texto))
      ubicaciones.add(UbicacionSala.CAFETERIA_A);
    else if (/cafeteria\s*b\b/.test(texto))
      ubicaciones.add(UbicacionSala.CAFETERIA_B);
    else if (/cafeteria|cafe\b|casino/.test(texto)) {
      ubicaciones.add(UbicacionSala.CAFETERIA_A);
      ubicaciones.add(UbicacionSala.CAFETERIA_B);
    }
    if (/aulario\s*a\b/.test(texto)) ubicaciones.add(UbicacionSala.AULARIO_A);
    else if (/aulario\s*c\b/.test(texto))
      ubicaciones.add(UbicacionSala.AULARIO_C);
    else if (/aulario/.test(texto)) {
      ubicaciones.add(UbicacionSala.AULARIO_A);
      ubicaciones.add(UbicacionSala.AULARIO_C);
    }
    if (/biblioteca/.test(texto)) ubicaciones.add(UbicacionSala.BIBLIOTECA);
    if (/auditorio|informatica|presentacion|exposicion/.test(texto)) {
      ubicaciones.add(UbicacionSala.AUDITORIO_INF);
    }

    const preferirBajaDemanda =
      /tranquil|silencio|silenciosa|poca gente|menos gente|sin gente|poco concurrid|calma|concentrar/.test(
        texto,
      );

    return {
      personas,
      bloques: [...bloques].sort((a, b) => a - b),
      ubicaciones: [...ubicaciones],
      preferirBajaDemanda,
      afinidad: this.afinidadPorPalabras(texto, salas),
    };
  }

  // Respaldo sin IA: % de palabras útiles de la consulta que aparecen en la descripción
  private afinidadPorPalabras(
    textoNormalizado: string,
    salas: SalaEntity[],
  ): Record<number, number> {
    const raiz = (p: string) => p.slice(0, 6); // "proyector" ≈ "proyectar"
    const palabras = [
      ...new Set(
        textoNormalizado
          .split(/[^a-z0-9]+/)
          .filter((p) => p.length >= 4 && !PALABRAS_VACIAS.has(p))
          .map(raiz),
      ),
    ];
    const afinidad: Record<number, number> = {};
    if (palabras.length === 0) return afinidad;

    for (const sala of salas) {
      if (!sala.descripcion) continue;
      const desc = new Set(
        this.normalizar(sala.descripcion)
          .split(/[^a-z0-9]+/)
          .filter((p) => p.length >= 4)
          .map(raiz),
      );
      const coincidencias = palabras.filter((p) => desc.has(p)).length;
      if (coincidencias > 0) {
        afinidad[sala.idSala] = Math.round(
          (100 * coincidencias) / palabras.length,
        );
      }
    }
    return afinidad;
  }

  // ───────────────────────── Paso 2 · scoring ─────────────────────────

  private async puntuar(
    criterios: CriteriosSala,
    bloques: number[],
    hoy: string,
    salas: SalaEntity[],
  ): Promise<RecomendacionSala[]> {
    if (bloques.length === 0) return [];

    // reservas activas de hoy → combinaciones sala/bloque ocupadas
    const reservasHoy = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.idSala', 'sala')
      .where('reserva.fechaReserva = :hoy', { hoy })
      .andWhere('reserva.estado = :estado', { estado: EstadoReserva.ACTIVA })
      .getMany();
    const ocupadas = new Set(
      reservasHoy.map((r) => `${r.idSala?.idSala}|${Number(r.bloqueHorario)}`),
    );

    // demanda histórica del mismo día de la semana (lógica de alta demanda existente)
    const demanda = await this.reserveRoomService.contarDemandaPorBloque(hoy);
    const maxDemanda = Math.max(1, ...bloques.map((b) => demanda.get(b) ?? 0));

    const pesoDemanda = criterios.preferirBajaDemanda ? 30 : 15;
    const candidatos: RecomendacionSala[] = [];

    for (const sala of salas) {
      // nunca recomendar una sala más chica que el grupo
      if (criterios.personas && sala.capacidad < criterios.personas) continue;

      // capacidad (máx 40): mejor mientras menos sobredimensionada
      const puntosCapacidad = criterios.personas
        ? 40 * (criterios.personas / sala.capacidad)
        : 25;

      // ubicación (máx 30)
      const coincideUbicacion = criterios.ubicaciones.includes(sala.ubicacion);
      const puntosUbicacion =
        criterios.ubicaciones.length === 0 ? 15 : coincideUbicacion ? 30 : 0;

      // descripción (máx 30): cuánto calza el equipamiento/ambiente con lo pedido
      const pidioCaracteristicas = Object.keys(criterios.afinidad).length > 0;
      const afinidad = criterios.afinidad[sala.idSala] ?? 0;
      const puntosDescripcion = pidioCaracteristicas
        ? 30 * (afinidad / 100)
        : 0;

      bloques.forEach((bloque, i) => {
        if (ocupadas.has(`${sala.idSala}|${bloque}`)) return;

        const reservas = demanda.get(bloque) ?? 0;
        const puntosDemanda = pesoDemanda * (1 - reservas / maxDemanda);
        // pequeño bonus a los bloques más próximos
        const puntosCercania = 10 * (1 - i / Math.max(1, bloques.length));

        // máximo teórico 140 (40+30+30+30+10) → se escala a 100
        const puntaje = Math.round(
          ((puntosCapacidad +
            puntosUbicacion +
            puntosDescripcion +
            puntosDemanda +
            puntosCercania) *
            100) /
            (pidioCaracteristicas ? 140 : 110),
        );

        candidatos.push({
          idSala: sala.idSala,
          nombreSala: sala.nombreSala,
          capacidad: sala.capacidad,
          ubicacion: UBICACIONES[sala.ubicacion] ?? 'Sin ubicación',
          descripcion: sala.descripcion ?? null,
          bloque,
          bloqueLetra: BLOQUES[bloque].letra,
          inicio: BLOQUES[bloque].inicio,
          fin: BLOQUES[bloque].fin,
          puntaje: Math.min(100, puntaje),
          reservasHistoricas: reservas,
          motivo: this.motivoRespaldo(
            criterios,
            sala,
            reservas,
            coincideUbicacion,
            afinidad,
          ),
        });
      });
    }

    candidatos.sort((a, b) => b.puntaje - a.puntaje || a.bloque - b.bloque);

    // top 3 con salas distintas primero (más variedad para el estudiante)
    const top: RecomendacionSala[] = [];
    for (const c of candidatos) {
      if (top.length === 3) break;
      if (!top.some((t) => t.idSala === c.idSala)) top.push(c);
    }
    for (const c of candidatos) {
      if (top.length === 3) break;
      if (!top.includes(c)) top.push(c);
    }
    // se muestran de mayor a menor puntaje (#1 siempre es el mejor)
    return top.sort((a, b) => b.puntaje - a.puntaje || a.bloque - b.bloque);
  }

  private motivoRespaldo(
    criterios: CriteriosSala,
    sala: SalaEntity,
    reservas: number,
    coincideUbicacion: boolean,
    afinidad = 0,
  ): string {
    const partes: string[] = [];
    if (afinidad >= 50 && sala.descripcion) {
      partes.push('su equipamiento calza con lo que pediste');
    }
    partes.push(
      criterios.personas === 1
        ? `Capacidad para ${sala.capacidad} (vas solo/a)`
        : criterios.personas
          ? `Capacidad para ${sala.capacidad} (ustedes son ${criterios.personas})`
          : `Capacidad para ${sala.capacidad} personas`,
    );
    if (coincideUbicacion) {
      partes.push(`está en ${UBICACIONES[sala.ubicacion]}, como pediste`);
    }
    partes.push(
      reservas === 0
        ? 'bloque sin reservas este día en el último mes'
        : `demanda histórica de ${reservas} reserva${reservas === 1 ? '' : 's'} en este bloque`,
    );
    return partes.join(' · ');
  }

  private explicacionRespaldo(
    criterios: CriteriosSala,
    recomendaciones: RecomendacionSala[],
  ): string {
    if (recomendaciones.length === 0) {
      return 'No hay salas que cumplan todos los criterios en este momento.';
    }
    const partes: string[] = [];
    if (criterios.personas) {
      partes.push(
        criterios.personas === 1
          ? 'para 1 persona'
          : `para ${criterios.personas} personas`,
      );
    }
    if (criterios.ubicaciones.length) {
      partes.push(
        `cerca de ${criterios.ubicaciones.map((u) => UBICACIONES[u]).join(' / ')}`,
      );
    }
    if (criterios.bloques.length) {
      const letras = criterios.bloques.map((b) => BLOQUES[b].letra);
      partes.push(
        letras.length === 1
          ? `en el bloque ${letras[0]}`
          : `en los bloques ${letras.join(', ')}`,
      );
    }
    const mejor = recomendaciones[0];
    return `Busqué salas libres hoy ${partes.join(', ') || 'en los próximos bloques'}. La mejor opción es ${mejor.nombreSala} en el bloque ${mejor.bloqueLetra} (${mejor.inicio}-${mejor.fin}).`;
  }

  // ───────────────────────── Paso 3 · IA ─────────────────────────

  private async redactarConIa(
    consulta: string,
    criterios: CriteriosSala,
    recomendaciones: RecomendacionSala[],
  ) {
    const datos = recomendaciones.map((r) => ({
      idSala: r.idSala,
      sala: r.nombreSala,
      capacidad: r.capacidad,
      ubicacion: r.ubicacion,
      descripcion: r.descripcion ?? 'sin descripción',
      bloque: r.bloque,
      horario: `${r.bloqueLetra} (${r.inicio}-${r.fin})`,
      puntaje: r.puntaje,
      reservasHistoricasMismoDiaYBloque: r.reservasHistoricas,
    }));

    return this.iaService.generarJson<{
      explicacion: string;
      motivos: { idSala: number; bloque: number; motivo: string }[];
    }>({
      sistema:
        'Eres el asistente de reservas de salas de una biblioteca universitaria. Explica en español de Chile, en tono cercano y breve, por qué se recomiendan estas salas. No inventes datos que no estén en la información entregada.',
      mensaje: `Consulta del estudiante: "${consulta}"
Criterios entendidos: ${JSON.stringify(criterios)}
Salas recomendadas (ya ordenadas por puntaje): ${JSON.stringify(datos)}

Devuelve "explicacion" (máximo 2 oraciones sobre la recomendación general) y en "motivos" un motivo de máximo 20 palabras para cada sala, usando el mismo idSala y bloque. Si la descripción de una sala tiene algo que el estudiante pidió (equipamiento, ambiente o uso), menciónalo en su motivo.`,
      schema: SCHEMA_EXPLICACION,
      maxTokens: 1024,
      timeoutMs: 5000,
      validar: (dato) => {
        const d = dato as { explicacion?: unknown; motivos?: unknown };
        if (typeof d?.explicacion !== 'string' || !Array.isArray(d.motivos)) {
          return null;
        }
        return {
          explicacion: d.explicacion.slice(0, 500),
          motivos: (d.motivos as Record<string, unknown>[])
            .filter((m) => typeof m?.motivo === 'string')
            .map((m) => ({
              idSala: Number(m.idSala),
              bloque: Number(m.bloque),
              motivo: String(m.motivo).slice(0, 250),
            })),
        };
      },
    });
  }

  // ───────────────────────── utilidades ─────────────────────────

  private ahoraSantiago(): { fecha: string; hora: string } {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('sv-SE', {
      timeZone: 'America/Santiago',
    });
    const hora = ahora.toLocaleTimeString('en-GB', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { fecha, hora };
  }

  // minúsculas y sin tildes para comparar palabras
  private normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''); // quita tildes (marcas diacríticas)
  }
}
