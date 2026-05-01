import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CatalogoModule } from './features/catalogo/catalogo.module';
import { MenuPrincipalModule } from './features/menu-principal/menu-principal.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CatalogoModule,
    MenuPrincipalModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
