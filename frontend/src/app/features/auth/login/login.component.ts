import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  
  activeRole: string = 'student'; 

  loginData = {
    netid: '',
    password: ''
  };

  setRole(role: string) {
    this.activeRole = role;
    this.loginData.netid = '';
    this.loginData.password = '';
  }

  // MODIFICAMOS ESTA FUNCIÓN para que reciba el formulario (form: any)
  onSubmit(form: any) {
    // Si el formulario es inválido (faltan datos), detenemos todo aquí
    if (form.invalid) {
      console.log("Faltan datos, no se envía nada al backend.");
      return; 
    }

    console.log(`Intentando ingresar como ${this.activeRole} con:`, this.loginData);
    alert(`Ingresando como: ${this.activeRole.toUpperCase()}`);
  }
}