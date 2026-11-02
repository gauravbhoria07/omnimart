import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty({ message: 'Promo code is required' })
  code: string;

  @IsNumber({}, { message: 'Discount percentage must be a number' })
  @Min(1, { message: 'Discount percentage must be at least 1%' })
  @Max(100, { message: 'Discount percentage cannot exceed 100%' })
  discountPercentage: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
