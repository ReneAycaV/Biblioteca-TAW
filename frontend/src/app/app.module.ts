import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CatalogoModule } from './features/catalogo/catalogo.module';
import { LoginComponent } from './features/auth/login/login.component';
import { FormsModule } from '@angular/forms';
import { ReservasModule } from './features/reservas/reservas.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CatalogoModule,
    FormsModule,
    ReservasModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
