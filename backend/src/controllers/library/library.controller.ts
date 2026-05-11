import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import { LibraryAccessService } from '../../providers/library-access.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse,} from '@nestjs/swagger';

@ApiTags('Library')
@Controller('library')
export class LibraryController {
  constructor(
    private readonly libraryAccessService: LibraryAccessService,
  ) {}


  @UseGuards(JwtAuthGuard)
  @Get('validate-loan')
  @ApiBearerAuth()  
  @ApiOperation({
  summary: 'Validate book loan',
    description: 'Checks if user is allowed to borrow books',
  })
  @ApiResponse({ status: 200 })
  async validateLoan(@Req() req: any) {

    const userId = req.user.id;

    await this.libraryAccessService.validateLoan(userId);

    return {
      success: true,
      message: 'User can borrow books',
      data: { canLoan: true },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate-room')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validador de reserva de salas',
    description: 'Validadando si el usuario puede reservar salas',
  })
  @ApiResponse({ status: 200 })
  async validateRoom(@Req() req: any) {

    const userId = req.user.id;

    await this.libraryService.validateRoom(userId);

    return {
      success: true,
      message: 'El usuario puede reservar salas',
      data: { canReserve: true },
    };
  }
}