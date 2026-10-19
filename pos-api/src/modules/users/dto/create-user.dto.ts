import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/types/jwt-payload.type';

export class CreateUserDto {
  @ApiProperty({ example: 'cashier@store1.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CASHIER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-store' })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}
