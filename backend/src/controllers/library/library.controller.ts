import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { LibraryAccessService } from '../../providers/library-access.service';
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryAccessService: LibraryAccessService) {}

  @UseGuards(JwtAuthGuard)
  @Get('validate-loan')
  async validateLoan(@Req() req: any) {
    await this.libraryAccessService.validateAcademicStatus(req.user.id);

    return {
      message: 'Usuario habilitado para solicitar préstamo',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate-room-reservation')
  async validateRoomReservation(@Req() req: any) {
    await this.libraryAccessService.validateNoPendingFines(req.user.id);

    return {
      message: 'Usuario habilitado para reservar sala',
    };
  }
}
