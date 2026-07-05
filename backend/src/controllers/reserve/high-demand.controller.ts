import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReserveRoomService } from '../../providers/reserve-room.service';

@ApiTags('Sistema de cafetería')
@Controller('sistema-de-cafeteria')
export class SistemaCafeteriaController {
  constructor(private readonly reserveRoomService: ReserveRoomService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener la demanda de horarios de cafetería',
    description:
      'Devuelve los bloques de horario más demandados en las salas de cafetería usando las reservas reales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payload listo para enviar a la otra web',
  })
  async getCafeteriaDemandPayload() {
    return this.reserveRoomService.getCafeteriaDemandData();
  }
}
