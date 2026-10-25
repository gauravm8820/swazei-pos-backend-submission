import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Growth Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'growth-plan' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Best for expanding retail businesses with up to 5 stores' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 499900, description: 'Price in minor units (paise/cents), e.g. 499900 = ₹4,999' })
  @IsNumber()
  @Min(0)
  priceMinorUnits: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 6, description: 'Validity duration in months' })
  @IsNumber()
  @Min(1)
  durationMonths: number;

  @ApiProperty({ example: 5, description: 'Maximum stores allowed under this plan' })
  @IsNumber()
  @Min(1)
  maxStores: number;

  @ApiProperty({ example: 20, description: 'Maximum staff users allowed under this plan' })
  @IsNumber()
  @Min(1)
  maxUsers: number;

  @ApiPropertyOptional({ example: ['Multi-store inventory', 'Real-time sales analytics', 'Redis caching'] })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
