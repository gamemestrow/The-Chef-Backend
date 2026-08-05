import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../types';

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

/**
 * Generates a signed JWT token containing user identity and role.
 */
export const signJwtToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

/**
 * Verifies and decodes a JWT token.
 */
export const verifyJwtToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
