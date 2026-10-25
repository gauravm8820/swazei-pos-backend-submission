import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-merchant' })
  @IsUUID()
  @IsNotEmpty()
  merchantId: string;

  @ApiPropertyOptional({ example: 'uuid-of-plan' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ example: 'growth', description: 'Plan slug (alternative to planId)' })
  @IsOptional()
  @IsString()
  planSlug?: string;

  @ApiPropertyOptional({ example: 6, description: 'Override duration in months (defaults to plan duration)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMonths?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 'Annual enterprise subscription agreement signed' })
  @IsOptional()
  @IsString()
  notes?: string;
}
