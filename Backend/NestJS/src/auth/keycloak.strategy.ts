import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

function decodeHeader(token: string): any {
  try {
    const header = token.split('.')[0];
    const json = Buffer.from(header, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return {};
  }
}

@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor() {
    const jwksUri = process.env.KEYCLOAK_JWKS_URI || '';
    const issuer = process.env.KEYCLOAK_ISSUER || '';
    const audience = process.env.KEYCLOAK_AUDIENCE || undefined;

    const jwks = jwksRsa({
      cache: true,
      rateLimit: true,
      jwksUri,
    }) as any;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer: issuer || undefined,
      audience,
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: (err: any, key?: string) => void) => {
        try {
          const { kid } = decodeHeader(rawJwtToken);
          jwks.getSigningKey(kid, (err: any, key: any) => {
            if (err) return done(err);
            const publicKey = key?.getPublicKey();
            done(null, publicKey);
          });
        } catch (e) {
          done(e);
        }
      },
    });
  }

  async validate(payload: any) {
    const roles = payload?.realm_access?.roles || payload?.resource_access?.roles || [];
    const username = payload?.preferred_username || payload?.sub;
    return { username, roles, keycloak: true, token: payload };
  }
}