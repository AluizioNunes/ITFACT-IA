import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { username, password } = body;
    const res = await this.auth.login(username, password);
    if (!res) return { error: 'invalid_credentials' };
    return res;
  }
}