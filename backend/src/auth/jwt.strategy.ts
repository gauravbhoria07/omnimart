import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '../db/db.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private dbService: DbService,
    private configService: ConfigService,
  ) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') ||
      'omnimart_dev_fallback_jwt_secret_key_2026';

    if (
      (!configService.get<string>('JWT_SECRET') ||
        configService.get<string>('JWT_SECRET') ===
          'omnimart_dev_fallback_jwt_secret_key_2026') &&
      process.env.NODE_ENV === 'production'
    ) {
      new Logger(JwtStrategy.name).warn(
        'SECURITY WARNING: JWT_SECRET environment variable is not explicitly configured in production! Using fallback key.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.dbService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
