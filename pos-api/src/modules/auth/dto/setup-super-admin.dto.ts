import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupSuperAdminDto {
  @ApiProperty({ example: 'superadmin@posplatform.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SuperAdminSecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Platform Administrator' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
