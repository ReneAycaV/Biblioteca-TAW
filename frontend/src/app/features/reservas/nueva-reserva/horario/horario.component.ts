import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EstadoSala } from '../../../../shared/enums/estado-sala.enum';
import { ReservaService } from '../../services/reservas.service';

const BLOQUES_CONFIG = [
  { id: 1, rango: '08:00 - 09:00' },
  { id: 2, rango: '09:00 - 10:00' },
  { id: 3, rango: '10:00 - 11:00' },
  { id: 4, rango: '11:00 - 12:00' },
  { id: 5, rango: '12:00 - 13:00' },
  { id: 6, rango: '13:00 - 14:00' },
  { id: 7, rango: '14:00 - 15:00' },
  { id: 8, rango: '15:00 - 16:00' },
  { id: 9, rango: '16:00 - 17:00' },
  { id: 10, rango: '17:00 - 18:00' },
  { id: 11, rango: '18:00 - 19:00' },
];

interface SalaReservaView {
  idSala: number;
  nombreSala: string;
  capacidad: number;
  ubicacion: string;
  tipo: 'Estudio' | 'Auditorio';
  estado: EstadoSala;
}

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css'],
})
export class HorarioComponent implements OnInit {
  dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
  bloques = BLOQUES_CONFIG;
  bloquesAgotados = ['Lunes-1', 'Miercoles-3', 'Jueves-11'];

  seleccionActual: { dia: string; idBloque: number; rango?: string } | null =
    null;

  filtros = ['Todos', 'Estudio', 'Auditorio'];
  filtroActivo = 'Todos';
  allSalas: SalaReservaView[] = [];
  cargandoSalas = false;
  errorSalas = '';

  constructor(
    private reservaService: ReservaService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.reservaService.datosTemporales.filtroActivo) {
      this.filtroActivo = this.reservaService.datosTemporales.filtroActivo;
    }
    this.cargarSalas();
  }

  seleccionarCelda(dia: string, idBloque: number) {
    const bloqueEncontrado = this.bloques.find((b) => Number(b.id) === idBloque);
    this.seleccionActual = {
      dia,
      idBloque,
      rango: bloqueEncontrado ? bloqueEncontrado.rango : 'Sin rango',
    };
  }

  esSeleccionado(dia: string, idBloque: number): boolean {
    return (
      this.seleccionActual?.dia === dia &&
      this.seleccionActual?.idBloque === idBloque
    );
  }

  esAgotado(dia: string, idBloque: number): boolean {
    return this.bloquesAgotados.includes(`${dia}-${idBloque}`);
  }

  cargarSalas() {
    this.cargandoSalas = true;
    this.errorSalas = '';

    this.reservaService.getSalas().subscribe({
      next: (salas) => {
        this.allSalas = Array.isArray(salas)
          ? salas
              .filter((s: any) => this.esSalaDisponible(s))
              .map((s: any) => this.mapearSala(s))
          : [];
        this.cargandoSalas = false;
      },
      error: (err) => {
        console.warn('No se pudieron cargar salas desde el backend:', err);
        this.allSalas = [];
        this.errorSalas = 'No se pudieron cargar las salas desde la base de datos.';
        this.cargandoSalas = false;
      },
    });
  }

  get salasFiltradas() {
    if (this.filtroActivo === 'Todos') return this.allSalas;
    return this.allSalas.filter((s) => s.tipo === this.filtroActivo);
  }

  get salasEstudio(): SalaReservaView[] {
    return this.allSalas.filter((sala) => sala.tipo === 'Estudio');
  }

  get salasAuditorio(): SalaReservaView[] {
    return this.allSalas.filter((sala) => sala.tipo === 'Auditorio');
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  irADetalles(sala: SalaReservaView) {
    this.reservaService.guardarSala(sala);
    if (this.seleccionActual) {
      this.reservaService.guardarHorario(this.seleccionActual);
    }

    this.router.navigate(['/detalle-sala', sala.idSala]);
  }

  contarSalas(tipo: string): number {
    return this.allSalas.filter((sala) => sala.tipo === tipo).length;
  }

  private mapearSala(sala: any): SalaReservaView {
    const ubicacion = Number(sala.ubicacion ?? sala.ubicacion_sala);
    const idSala = sala.idSala ?? sala.id;

    return {
      idSala,
      nombreSala: sala.nombreSala ?? sala.nombre ?? `Sala ${idSala}`,
      capacidad: sala.capacidad ?? sala.capacidad_sala ?? 0,
      ubicacion: this.formatearUbicacion(ubicacion),
      tipo: ubicacion === 6 ? 'Auditorio' : 'Estudio',
      estado: Number(sala.estado),
    };
  }

  private esSalaDisponible(sala: any): boolean {
    return Number(sala.estado ?? sala.estado_sala) === EstadoSala.DISPONIBLE;
  }

  private formatearUbicacion(ubicacion: number): string {
    const ubicaciones: Record<number, string> = {
      1: 'Biblioteca',
      2: 'Aulario A',
      3: 'Aulario C',
      4: 'Cafeteria A',
      5: 'Cafeteria B',
      6: 'Auditorio INF',
    };

    return ubicaciones[ubicacion] ?? 'Sin ubicacion';
  }
}
