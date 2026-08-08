import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities';
import { JwtPayloadUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService, @InjectRepository(User) private usersRepository: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') as string,
    });
  }

  async validate(payload: JwtPayloadUser): Promise<JwtPayloadUser> {
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('User not found or inactive');
    return { sub: payload.sub, email: payload.email };
  }
}
