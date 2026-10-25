import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { JwtPayload, UserRole } from '../../common/types/jwt-payload.type';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = {
      sub: user.id,
      merchantId: user.merchantId,
      storeId: user.storeId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId,
        storeId: user.storeId,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const newPayload: JwtPayload = {
        sub: payload.sub,
        merchantId: payload.merchantId,
        storeId: payload.storeId,
        role: payload.role,
      };
      return { accessToken: this.jwtService.sign(newPayload) };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async setupSuperAdmin(dto: { email: string; password: string; fullName: string }) {
    const existingAdmins = await this.usersService.findSuperAdmins();
    if (existingAdmins.length > 0) {
      throw new UnauthorizedException(
        'Platform Super Admin already configured. Please log in directly via POST /auth/login.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const superAdmin = await this.usersService.createSuperAdmin(dto.email, passwordHash);

    const payload: JwtPayload = {
      sub: superAdmin.id,
      merchantId: null,
      storeId: null,
      role: UserRole.SUPER_ADMIN,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      message: 'Platform Super Admin successfully initialized',
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role,
        merchantId: null,
        storeId: null,
      },
    };
  }
}
