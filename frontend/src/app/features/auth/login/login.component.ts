import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  
  // 1. Variable para saber en qué vista estamos (por defecto 'student')
  activeRole: string = 'student'; 

  loginData = {
    email: '',
    password: ''
  };

  // 2. Función que se activa al hacer click en los botones
  setRole(role: string) {
    this.activeRole = role;
    // Opcional: limpiar los campos al cambiar de pestaña
    this.loginData.email = '';
    this.loginData.password = '';
  }

  onSubmit() {
    // Ahora podemos saber qué tipo de usuario intenta entrar
    console.log(`Intentando ingresar como ${this.activeRole} con:`, this.loginData);
    alert(`Ingresando como: ${this.activeRole.toUpperCase()}`);
  }
}