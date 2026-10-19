import {
  IsString, IsNotEmpty, IsNumber, IsInt, IsOptional,
  MaxLength, Min, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Espresso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @ApiPropertyOptional({ example: 'Single shot espresso' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 18000, description: 'Price in minor units (paise). 18000 = ₹180' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceMinorUnits: number;

  @ApiPropertyOptional({ example: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ example: 'ESP-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;
}
