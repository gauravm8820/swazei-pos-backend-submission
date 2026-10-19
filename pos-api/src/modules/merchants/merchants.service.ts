import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MerchantsRepository } from './merchants.repository';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private readonly merchantsRepo: MerchantsRepository) {}

  async findMe(user: JwtPayload) {
    const merchant = await this.merchantsRepo.findById(user.merchantId);
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async update(user: JwtPayload, dto: UpdateMerchantDto) {
    if (user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only the OWNER can update merchant details');
    }
    const merchant = await this.merchantsRepo.findById(user.merchantId);
    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.merchantsRepo.update(user.merchantId, dto);
  }
}
