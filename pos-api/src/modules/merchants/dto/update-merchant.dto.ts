import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMerchantDto {
  @ApiPropertyOptional({ example: 'My Coffee Chain' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
