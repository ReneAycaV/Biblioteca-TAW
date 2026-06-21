import { Component } from '@angular/core';
import { Libro } from '../../catalogo/lista-libros/lista-libros.component';

@Component({
  selector: 'app-crear-prestamo',
  templateUrl: './crear-prestamo.component.html',
  styleUrls: ['./crear-prestamo.component.css'],
})
export class CrearPrestamoComponent {
  libro: Libro = {
    id: 1,
    titulo: 'Cien Años de Soledad',
    autor: 'Gabriel García Márquez',
    anio: 1967,
    genero: 'Literatura',
    disponibilidad: 'disponible',
  };

  /**
   * Devuelve el color primario del gradiente de portada según el género.
   * Si el género no está en el mapa, usa el color morado NYU por defecto.
   */
  getCoverColor(genero: string): string {
    const map: { [key: string]: string } = {
      Literatura: '#702B9D',
      Ciencias: '#009B8A',
      Historia: '#330662',
      Tecnología: '#59B2D1',
      Filosofía: '#7B5AA6',
    };
    return map[genero] ?? '#57068C';
  }

  /**
   * Devuelve el color de acento (segundo color) del gradiente de portada.
   * Se usa en conjunto con getCoverColor para construir el linear-gradient.
   */
  getCoverAccent(genero: string): string {
    const map: { [key: string]: string } = {
      Literatura: '#9B4BC7',
      Ciencias: '#00BFA8',
      Historia: '#5A0FA8',
      Tecnología: '#7EC8E3',
      Filosofía: '#9B75C0',
    };
    return map[genero] ?? '#702B9D';
  }

  // Extrae la primera letra del título en mayúscula para mostrarla en la portada
  getInitial(titulo: string): string {
    return titulo.charAt(0).toUpperCase();
  }

  // Fecha actual para mostrar en el formulario
  today = new Date().toISOString().split('T')[0];
}
