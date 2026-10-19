import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateInventoryDto {
  @ApiProperty({ example: 50, description: 'Stock quantity (>= 0)' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quantity: number;
}
