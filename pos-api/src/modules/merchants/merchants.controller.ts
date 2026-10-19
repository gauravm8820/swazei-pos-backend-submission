import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@ApiTags('Merchants')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get own merchant info' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return { data: await this.merchantsService.findMe(user) };
  }

  @Patch('me')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update merchant (OWNER only)' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMerchantDto,
  ) {
    return { data: await this.merchantsService.update(user, dto) };
  }
}
