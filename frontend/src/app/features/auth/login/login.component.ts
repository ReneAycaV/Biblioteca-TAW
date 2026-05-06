import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ILoginRequestDTO } from '../../../shared/dtos/auth/login-request.dto';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  // Rol seleccionado por el usuario en la UI
  rolActivo: string = 'estudiante';

  // Modelo del formulario de login
  loginData: ILoginRequestDTO = {
    email: '',
    password: ''
  };

  // Mensaje de error de validación de la UI
  mensajeError: string = '';

  // Constructor: solo inyección de dependencias
  constructor(private router: Router) {}

  ngOnInit(): void {}

  // Cambia el rol activo y limpia el formulario y errores
  cambiarRol(rol: string): void {
    this.rolActivo = rol;
    this.loginData = { email: '', password: '' };
    this.mensajeError = '';
  }

  // Valida el formulario y navega al catálogo
  // TODO: integrar llamada a la API de autenticación cuando el backend esté disponible
  onSubmit(form: any): void {
    if (form.invalid) {
      return;
    }
    console.log(`Ingresando como ${this.rolActivo}:`, this.loginData);
    this.router.navigate(['/catalogo']);
  }
}
