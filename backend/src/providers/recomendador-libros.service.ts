import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { LibroEntity } from '../database/entities/libro.entity';
import { PrestamoEntity } from '../database/entities/prestamo.entity';
import { IaService } from './ia.service';

// Estado 0 = libro desactivado por un administrador (no se recomienda)
const ESTADO_INACTIVO = 0;
const MAX_RECOMENDACIONES = 6;
const MAX_RESULTADOS_BUSQUEDA = 8;

export interface LibroRecomendado {
  libro: LibroEntity;
  motivo: string;
  puntaje: number;
}

export interface RespuestaRecomendacionesLibros {
  modo: 'ia' | 'respaldo';
  tipo: 'historial' | 'populares';
  basadoEn: string[];
  recomendaciones: LibroRecomendado[];
}

export interface RespuestaBusquedaInteligente {
  modo: 'ia' | 'respaldo';
  consulta: string;
  resultados: LibroRecomendado[];
}

interface SeleccionIa {
  idLibro: number;
  motivo: string;
}

const SCHEMA_SELECCION = {
  type: 'object',
  properties: {
    libros: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          idLibro: { type: 'integer' },
          motivo: { type: 'string' },
        },
        required: ['idLibro', 'motivo'],
        additionalProperties: false,
      },
    },
  },
  required: ['libros'],
  additionalProperties: false,
};

// Palabras vacías que no aportan a la búsqueda por palabras
const STOPWORDS = new Set(
  'a al algo algun alguna algunos ante como con contra cual cuales de del desde donde el ella ellos en entre era es esa ese eso esta este esto estos hay la las le les lo los mas me mi mis muy necesito ni no nos o otra otro para pero por que quiero quisiera se sea ser si sin sobre su sus tambien tema temas tengo un una unas uno unos y ya libro libros leer busco buscando algo sobre trate traten hable hablen'.split(
    ' ',
  ),
);

@Injectable()
export class RecomendadorLibrosService {
  constructor(
    @InjectRepository(LibroEntity)
    private readonly libroRepository: Repository<LibroEntity>,
    @InjectRepository(PrestamoEntity)
    private readonly prestamoRepository: Repository<PrestamoEntity>,
    private readonly iaService: IaService,
  ) {}

  // ─────────────── GET /libros/recomendaciones ───────────────

  async recomendaciones(
    usuarioId: number,
  ): Promise<RespuestaRecomendacionesLibros> {
    const catalogo = await this.catalogoActivo();
    const historial = await this.historialUsuario(usuarioId);

    // Sin historial → los más pedidos de la biblioteca
    if (historial.length === 0) {
      return {
        modo: 'respaldo',
        tipo: 'populares',
        basadoEn: [],
        recomendaciones: await this.masPedidos(catalogo),
      };
    }

    const idsLeidos = new Set(historial.map((l) => l.idLibro));
    const candidatos = catalogo.filter((l) => !idsLeidos.has(l.idLibro));
    const basadoEn = historial.slice(0, 5).map((l) => l.titulo ?? 'Sin título');

    // Intento con IA
    const seleccion = await this.seleccionarConIa(
      'Recomienda libros a un estudiante según lo que ya pidió prestado. Prioriza temas, categorías y autores relacionados, y libros con stock disponible. Cada motivo debe empezar con "Porque pediste" seguido del título del libro relacionado entre comillas «».',
      `Libros que el estudiante pidió antes (del más reciente al más antiguo):\n${JSON.stringify(historial.slice(0, 10).map((l) => this.compacto(l)))}`,
      candidatos,
      MAX_RECOMENDACIONES,
    );
    if (seleccion) {
      return {
        modo: 'ia',
        tipo: 'historial',
        basadoEn,
        recomendaciones: seleccion,
      };
    }

    // Respaldo por reglas: misma categoría o autor del historial + stock
    const porReglas = this.recomendarPorReglas(historial, candidatos);

    // si quedan cupos, se completan con los más pedidos que aún no ha leído
    if (porReglas.length < MAX_RECOMENDACIONES) {
      const incluidos = new Set(porReglas.map((r) => r.libro.idLibro));
      const relleno = (await this.masPedidos(candidatos)).filter(
        (r) => !incluidos.has(r.libro.idLibro),
      );
      porReglas.push(
        ...relleno
          .slice(0, MAX_RECOMENDACIONES - porReglas.length)
          .map((r) => ({
            ...r,
            puntaje: Math.min(r.puntaje, 10),
            motivo: `${r.motivo} · para explorar algo distinto a lo que sueles pedir`,
          })),
      );
    }

    return {
      modo: 'respaldo',
      tipo: 'historial',
      basadoEn,
      recomendaciones: porReglas,
    };
  }

  // ─────────────── POST /libros/busqueda-inteligente ───────────────

  async busquedaInteligente(
    consulta: string,
    usuarioId: number,
  ): Promise<RespuestaBusquedaInteligente> {
    const catalogo = await this.catalogoActivo();

    const seleccion = await this.seleccionarConIa(
      'Un estudiante describe con sus palabras el tema que necesita. Elige del catálogo los libros realmente relevantes para ese tema (puede no haber ninguno; no fuerces resultados). Ordénalos del más al menos relevante y explica en una frase breve por qué sirve cada uno.',
      `Lo que busca el estudiante: "${consulta}"`,
      catalogo,
      MAX_RESULTADOS_BUSQUEDA,
    );
    if (seleccion) {
      return { modo: 'ia', consulta, resultados: seleccion };
    }

    const historial = await this.historialUsuario(usuarioId);
    return {
      modo: 'respaldo',
      consulta,
      resultados: this.buscarPorPalabras(consulta, catalogo, historial),
    };
  }

  // ───────────────────────── IA ─────────────────────────

  /**
   * Manda el catálogo compacto al modelo y le pide ids rankeados con motivo.
   * Valida que cada id exista entre los candidatos; si algo falla devuelve null.
   */
  private async seleccionarConIa(
    instruccion: string,
    contexto: string,
    candidatos: LibroEntity[],
    maximo: number,
  ): Promise<LibroRecomendado[] | null> {
    if (!this.iaService.estaDisponible() || candidatos.length === 0) {
      return null;
    }

    const porId = new Map(candidatos.map((l) => [l.idLibro, l]));
    const catalogoCompacto = candidatos.map((l) => this.compacto(l));

    const resultado = await this.iaService.generarJson<SeleccionIa[]>({
      sistema: `Eres el bibliotecario de una biblioteca universitaria en Chile. Respondes en español. ${instruccion}
Solo puedes elegir libros del catálogo entregado, usando su idLibro exacto. Devuelve como máximo ${maximo} libros.`,
      mensaje: `${contexto}\n\nCatálogo disponible:\n${JSON.stringify(catalogoCompacto)}`,
      schema: SCHEMA_SELECCION,
      maxTokens: 2048,
      // margen para las consultas a la base: la respuesta completa queda bajo ~15 s
      timeoutMs: 11000,
      validar: (dato) => {
        const libros = (dato as { libros?: unknown })?.libros;
        if (!Array.isArray(libros)) return null;
        const vistos = new Set<number>();
        const validos: SeleccionIa[] = [];
        for (const item of libros as Record<string, unknown>[]) {
          const id = Number(item?.idLibro);
          // se descartan ids inventados o repetidos
          if (!porId.has(id) || vistos.has(id)) continue;
          vistos.add(id);
          validos.push({
            idLibro: id,
            motivo:
              typeof item.motivo === 'string' ? item.motivo.slice(0, 250) : '',
          });
        }
        return validos;
      },
    });

    if (!resultado) return null;

    // Los libros que se pueden pedir ahora van primero; dentro de cada grupo
    // se respeta el orden de relevancia que eligió la IA (sort es estable).
    const sePuedePedir = (id: number) => {
      const l = porId.get(id)!;
      return l.disponible && l.stockDisponible > 0 ? 0 : 1;
    };
    resultado.sort((a, b) => sePuedePedir(a.idLibro) - sePuedePedir(b.idLibro));

    return resultado.slice(0, maximo).map((s, i) => ({
      libro: porId.get(s.idLibro)!,
      motivo: s.motivo,
      puntaje: Math.max(1, 100 - i * 8),
    }));
  }

  // ───────────────────────── respaldo ─────────────────────────

  private recomendarPorReglas(
    historial: LibroEntity[],
    candidatos: LibroEntity[],
  ): LibroRecomendado[] {
    const resultado: LibroRecomendado[] = [];

    for (const libro of candidatos) {
      let puntaje = 0;
      let relacionado: LibroEntity | null = null;
      let razon = '';

      for (const previo of historial) {
        let p = 0;
        let r = '';
        if (
          libro.autor &&
          previo.autor &&
          this.igual(libro.autor, previo.autor)
        ) {
          p += 50;
          r = `mismo autor: ${libro.autor}`;
        }
        if (
          libro.categoria &&
          previo.categoria &&
          this.igual(libro.categoria, previo.categoria)
        ) {
          p += 35;
          r = r
            ? `${r} y misma categoría`
            : `misma categoría: ${libro.categoria}`;
        }
        if (p > puntaje) {
          puntaje = p;
          relacionado = previo;
          razon = r;
        }
      }

      if (!relacionado) continue;
      if (libro.stockDisponible > 0) puntaje += 15; // prioriza lo que se puede pedir ya

      resultado.push({
        libro,
        puntaje,
        motivo: `Porque pediste «${relacionado.titulo}» (${razon})`,
      });
    }

    return resultado
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_RECOMENDACIONES);
  }

  private buscarPorPalabras(
    consulta: string,
    catalogo: LibroEntity[],
    historial: LibroEntity[],
  ): LibroRecomendado[] {
    // raíz normalizada → palabra tal como la escribió el estudiante (para el motivo)
    const originales = new Map<string, string>();
    for (const palabra of consulta.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
      const norm = this.normalizar(palabra);
      if (norm.length >= 3 && !STOPWORDS.has(norm)) {
        originales.set(this.raiz(norm), palabra);
      }
    }
    const terminos = [...originales.keys()];
    if (terminos.length === 0) return [];

    const categoriasHistorial = new Set(
      historial.map((l) => this.normalizar(l.categoria ?? '')).filter(Boolean),
    );
    const autoresHistorial = new Set(
      historial.map((l) => this.normalizar(l.autor ?? '')).filter(Boolean),
    );

    const campos: { clave: keyof LibroEntity; peso: number; nombre: string }[] =
      [
        { clave: 'titulo', peso: 3, nombre: 'título' },
        { clave: 'categoria', peso: 2.5, nombre: 'categoría' },
        { clave: 'autor', peso: 2, nombre: 'autor' },
        { clave: 'descripcion', peso: 1, nombre: 'descripción' },
      ];

    const resultado: LibroRecomendado[] = [];
    for (const libro of catalogo) {
      let puntaje = 0;
      const coincidencias = new Set<string>();
      const camposCoinciden = new Set<string>();

      for (const campo of campos) {
        const palabras = this.normalizar(String(libro[campo.clave] ?? ''))
          .split(/[^a-z0-9ñ]+/)
          .filter(Boolean)
          .map((p) => this.raiz(p));
        for (const termino of terminos) {
          if (
            palabras.some(
              (p) =>
                p === termino || (termino.length >= 5 && p.startsWith(termino)),
            )
          ) {
            puntaje += campo.peso;
            coincidencias.add(originales.get(termino) ?? termino);
            camposCoinciden.add(campo.nombre);
          }
        }
      }
      if (puntaje === 0) continue;

      // bonus: misma categoría o autor que el historial del usuario, y stock
      let extra = '';
      if (categoriasHistorial.has(this.normalizar(libro.categoria ?? ''))) {
        puntaje += 1;
        extra = ' · categoría que ya has pedido';
      } else if (autoresHistorial.has(this.normalizar(libro.autor ?? ''))) {
        puntaje += 1;
        extra = ' · autor que ya has leído';
      }
      if (libro.stockDisponible > 0) puntaje += 0.5;

      resultado.push({
        libro,
        puntaje: Math.round(puntaje * 10),
        motivo: `Coincide con «${[...coincidencias].join('», «')}» en ${[...camposCoinciden].join(', ')}${extra}`,
      });
    }

    return resultado
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_RESULTADOS_BUSQUEDA);
  }

  private async masPedidos(
    catalogo: LibroEntity[],
  ): Promise<LibroRecomendado[]> {
    const conteo: { idLibro: string; total: string }[] =
      await this.prestamoRepository
        .createQueryBuilder('prestamo')
        .select('prestamo.id_libros', 'idLibro')
        .addSelect('COUNT(*)', 'total')
        .groupBy('prestamo.id_libros')
        .getRawMany();

    const totales = new Map(
      conteo.map((c) => [Number(c.idLibro), Number(c.total)]),
    );

    return catalogo
      .map((libro) => {
        const total = totales.get(libro.idLibro) ?? 0;
        return {
          libro,
          // los más pedidos primero y, a igualdad, los que tienen stock
          puntaje: total * 10 + (libro.stockDisponible > 0 ? 5 : 0),
          motivo:
            total > 0
              ? `Uno de los más pedidos (${total} préstamo${total === 1 ? '' : 's'})`
              : 'Disponible en el catálogo',
        };
      })
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, MAX_RECOMENDACIONES);
  }

  // ───────────────────────── utilidades ─────────────────────────

  private catalogoActivo(): Promise<LibroEntity[]> {
    return this.libroRepository.find({
      where: { estado: Not(ESTADO_INACTIVO) },
      order: { titulo: 'ASC' },
    });
  }

  // Libros que el usuario pidió, del más reciente al más antiguo, sin repetir
  private async historialUsuario(usuarioId: number): Promise<LibroEntity[]> {
    const prestamos = await this.prestamoRepository.find({
      where: { usuario: { idUsuario: usuarioId } },
      relations: ['libro'],
      order: { fechaPrestamo: 'DESC' },
    });
    const vistos = new Set<number>();
    const libros: LibroEntity[] = [];
    for (const p of prestamos) {
      if (p.libro && !vistos.has(p.libro.idLibro)) {
        vistos.add(p.libro.idLibro);
        libros.push(p.libro);
      }
    }
    return libros;
  }

  private compacto(l: LibroEntity) {
    return {
      idLibro: l.idLibro,
      titulo: l.titulo,
      autor: l.autor,
      categoria: l.categoria,
      descripcion: (l.descripcion ?? '').slice(0, 200),
      stock: l.stockDisponible,
    };
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '') // quita tildes
      .trim();
  }

  // Raíz muy simple para plurales: "algoritmos" → "algoritmo", "redes"/"red" → "red"
  private raiz(palabra: string): string {
    let r = palabra;
    if (r.length > 3 && r.endsWith('s')) r = r.slice(0, -1);
    if (r.length > 3 && r.endsWith('e')) r = r.slice(0, -1);
    return r;
  }

  private igual(a: string, b: string): boolean {
    return this.normalizar(a) === this.normalizar(b);
  }
}
