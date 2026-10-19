import {
  Controller, Get, Post, Delete, Body, Param, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, JwtPayload } from '../../common/types/jwt-payload.type';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a user within the merchant' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return { data: await this.usersService.create(user, dto) };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users for the merchant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return { data: await this.usersService.findAll(user) };
  }

  @Get(':userId')
  @Roles(UserRole.MANAGER)
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return { data: await this.usersService.findOne(user, userId) };
  }

  @Delete(':userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a user' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.softDelete(user, userId);
  }
}
