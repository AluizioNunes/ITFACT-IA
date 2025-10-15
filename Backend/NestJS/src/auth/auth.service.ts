import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async validateUser(username: string, password: string) {
    const admin = process.env.ADMIN_USER || 'admin';
    const pass = process.env.ADMIN_PASS || 'admin';
    if (username === admin && password === pass) {
      return { username, roles: ['admin'] };
    }
    return null;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    if (!user) return null;
    const token = await this.jwt.signAsync({ sub: user.username, roles: user.roles });
    return { access_token: token };
  }
}