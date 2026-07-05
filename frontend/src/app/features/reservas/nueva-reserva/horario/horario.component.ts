import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservaService } from '../../services/reservas.service';
import { ISala } from '../../../../shared/interfaces/isala';

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

interface SalaReserva extends ISala {
  tipo: 'Estudio' | 'Auditorio';
}

@Component({
  selector: 'app-horario',
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css'],
})
export class HorarioComponent implements OnInit {
  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  bloques = BLOQUES_CONFIG;
  bloquesAgotados = ['Lunes-1', 'Miércoles-3', 'Jueves-11'];

  seleccionActual: { dia: string; idBloque: number; rango?: string } | null =
    null;

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

  // Lógica de selección
  seleccionarCelda(dia: string, idBloque: number) {
    const bloqueEncontrado = this.bloques.find((b) => Number(b.id) === idBloque);
    this.seleccionActual = {
      dia: dia,
      idBloque: idBloque,
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

  // 1. Filtros
  filtros = ['Todos', 'Estudio', 'Auditorio', 'Computación'];
  filtroActivo = 'Todos';

  allSalas: SalaReserva[] = [];

  cargarSalas() {
    this.reservaService.getSalas().subscribe({
      next: (salas) => {
        this.allSalas = Array.isArray(salas)
          ? salas.map((sala) => ({
              ...sala,
              tipo: this.getTipoSala(sala.ubicacion),
            }))
          : [];
      },
      error: (err) => {
        console.warn('No se pudieron cargar salas desde el backend:', err);
      },
    });
  }

  // 3. El filtro automático
  get salasFiltradas() {
    if (this.filtroActivo === 'Todos') return this.allSalas;
    return this.allSalas.filter((s) => s.tipo === this.filtroActivo);
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  irADetalles(sala: any) {
    this.reservaService.guardarSala(sala);
    if (this.seleccionActual) {
      this.reservaService.guardarHorario(this.seleccionActual);
    }

    this.router.navigate(['/detalle-sala', sala.idSala]);
  }
  contarSalas(tipo: string): number {
    return this.allSalas.filter((sala) => sala.tipo === tipo).length;
  }

  private getTipoSala(ubicacion: string): 'Estudio' | 'Auditorio' {
    return ubicacion.toLowerCase().includes('auditorio')
      ? 'Auditorio'
      : 'Estudio';
  }
}
