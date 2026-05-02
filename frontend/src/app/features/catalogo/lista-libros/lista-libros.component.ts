import { Component } from '@angular/core';

export interface Libro {
  id: number;
  titulo: string;
  autor: string;
  anio: number;
  genero: string;
  disponibilidad: 'disponible' | 'prestado' | 'reservado';
}

@Component({
  selector: 'app-lista-libros',
  templateUrl: './lista-libros.component.html',
  styleUrls: ['./lista-libros.component.scss']
})
export class ListaLibrosComponent {

  searchQuery = '';
  filtroActivo = 'todos';

  filtros = ['Todos', 'Disponibles', 'Literatura', 'Ciencias', 'Historia', 'Tecnología', 'Filosofía'];

  libros: Libro[] = [
    { id: 1,  titulo: 'Cien Años de Soledad',         autor: 'Gabriel García Márquez',   anio: 1967, genero: 'Literatura',  disponibilidad: 'disponible' },
    { id: 2,  titulo: 'Don Quijote de la Mancha',     autor: 'Miguel de Cervantes',       anio: 1605, genero: 'Literatura',  disponibilidad: 'prestado'   },
    { id: 3,  titulo: 'Breve Historia del Tiempo',    autor: 'Stephen Hawking',           anio: 1988, genero: 'Ciencias',   disponibilidad: 'disponible' },
    { id: 4,  titulo: 'Sapiens: De animales a dioses',autor: 'Yuval Noah Harari',         anio: 2011, genero: 'Historia',   disponibilidad: 'reservado'  },
    { id: 5,  titulo: 'El Principito',                autor: 'Antoine de Saint-Exupéry', anio: 1943, genero: 'Literatura',  disponibilidad: 'disponible' },
    { id: 6,  titulo: 'El Arte de la Guerra',         autor: 'Sun Tzu',                  anio: -500, genero: 'Filosofía',  disponibilidad: 'disponible' },
    { id: 7,  titulo: 'Python para Todos',            autor: 'Charles Severance',        anio: 2016, genero: 'Tecnología', disponibilidad: 'prestado'   },
    { id: 8,  titulo: 'Introduction to Algorithms',   autor: 'Cormen et al.',            anio: 2009, genero: 'Tecnología', disponibilidad: 'disponible' },
    { id: 9,  titulo: 'La Odisea',                   autor: 'Homero',                   anio: -800, genero: 'Literatura',  disponibilidad: 'reservado'  },
    { id: 10, titulo: 'El Origen de las Especies',   autor: 'Charles Darwin',           anio: 1859, genero: 'Ciencias',   disponibilidad: 'disponible' },
    { id: 11, titulo: 'Así Habló Zaratustra',        autor: 'Friedrich Nietzsche',      anio: 1883, genero: 'Filosofía',  disponibilidad: 'disponible' },
    { id: 12, titulo: 'Historia Universal',          autor: 'Herodoto',                 anio: -440, genero: 'Historia',   disponibilidad: 'prestado'   },
    { id: 13, titulo: 'El Gran Gatsby',              autor: 'F. Scott Fitzgerald',      anio: 1925, genero: 'Literatura',  disponibilidad: 'disponible' },
    { id: 14, titulo: 'Clean Code',                  autor: 'Robert C. Martin',         anio: 2008, genero: 'Tecnología', disponibilidad: 'disponible' },
    { id: 15, titulo: 'Meditaciones',               autor: 'Marco Aurelio',            anio: 180,  genero: 'Filosofía',  disponibilidad: 'disponible' },
    { id: 16, titulo: 'Historia de dos ciudades',   autor: 'Charles Dickens',          anio: 1859, genero: 'Literatura',  disponibilidad: 'reservado'  },
  ];

  /**
   * Retorna la lista de libros filtrada por búsqueda de texto y por el chip activo.
   * - matchSearch: filtra por título o autor si hay texto en el input.
   * - matchFiltro: filtra por 'todos', 'disponibles' o por género exacto.
   * Ambas condiciones deben cumplirse para que el libro aparezca.
   */
  get librosFiltrados(): Libro[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.libros.filter(libro => {
      const matchSearch = !q ||
        libro.titulo.toLowerCase().includes(q) ||
        libro.autor.toLowerCase().includes(q);

      const f = this.filtroActivo;
      const matchFiltro =
        f === 'todos' ||
        (f === 'disponibles' && libro.disponibilidad === 'disponible') ||
        libro.genero.toLowerCase() === f.toLowerCase();

      return matchSearch && matchFiltro;
    });
  }

  // Normaliza el filtro a minúsculas para compararlo con los valores del getter
  setFiltro(filtro: string): void {
    this.filtroActivo = filtro.toLowerCase();
  }

  /**
   * Devuelve el color primario del gradiente de portada según el género.
   * Si el género no está en el mapa, usa el color morado NYU por defecto.
   */
  getCoverColor(genero: string): string {
    const map: { [key: string]: string } = {
      'Literatura':  '#702B9D',
      'Ciencias':    '#009B8A',
      'Historia':    '#330662',
      'Tecnología':  '#59B2D1',
      'Filosofía':   '#7B5AA6',
    };
    return map[genero] ?? '#57068C';
  }

  /**
   * Devuelve el color de acento (segundo color) del gradiente de portada.
   * Se usa en conjunto con getCoverColor para construir el linear-gradient.
   */
  getCoverAccent(genero: string): string {
    const map: { [key: string]: string } = {
      'Literatura':  '#9B4BC7',
      'Ciencias':    '#00BFA8',
      'Historia':    '#5A0FA8',
      'Tecnología':  '#7EC8E3',
      'Filosofía':   '#9B75C0',
    };
    return map[genero] ?? '#702B9D';
  }

  // Extrae la primera letra del título en mayúscula para mostrarla en la portada
  getInitial(titulo: string): string {
    return titulo.charAt(0).toUpperCase();
  }
}
