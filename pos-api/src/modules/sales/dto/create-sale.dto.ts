import {
  IsArray, IsUUID, IsInt, Min, Max, ArrayMinSize, ArrayMaxSize,
  ValidateNested, IsOptional, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaleItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}

export class CreateSaleDto {
  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiPropertyOptional({
    description: 'Payment metadata. Set simulateFailure: true to test failure path.',
    example: { simulateFailure: false },
  })
  @IsOptional()
  @IsObject()
  paymentMetadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Payment details from POS terminal (e.g. method: CASH, amountMinorUnits)',
    example: { method: 'CASH', amountMinorUnits: 44000 },
  })
  @IsOptional()
  @IsObject()
  payment?: Record<string, unknown>;
}
