import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth.module';
import { ReserveModule } from './modules/reserve.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { LibrosModule } from './modules/libros.module';
import { PrestamosModule } from './modules/prestamos.module';
import { HistorialModule } from './modules/historial.module';
import { SalasAdminModule } from './modules/salas-admin.module';
import { UsuariosModule } from './modules/usuarios.module';
import { IaModule } from './modules/ia.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    AuthModule,

    // Recomendadores con IA: va antes de LibrosModule para que
    // /libros/recomendaciones no choque con /libros/:id
    IaModule,

    LibrosModule,
    PrestamosModule,
    HistorialModule,
    ReserveModule,
    SalasAdminModule,
    UsuariosModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
