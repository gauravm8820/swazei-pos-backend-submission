import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEmail,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMerchantDto {
  @ApiPropertyOptional({ example: 'Blue Tokai Coffee Roasters' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Blue Tokai Coffee Roasters' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: 'blue-tokai' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'uuid-of-subscription-plan' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ example: 'growth', description: 'Plan slug (alternative to planId)' })
  @IsOptional()
  @IsString()
  planSlug?: string;

  @ApiPropertyOptional({ example: 6, description: 'Duration in months (defaults to plan duration)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ example: 'Initial setup notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'owner@bluetokai.com' })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ example: 'OwnerSecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  ownerPassword: string;
}
