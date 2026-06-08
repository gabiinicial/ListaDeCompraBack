import jwt from 'jsonwebtoken';

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

export const signToken = (payload: AuthTokenPayload, secret: string, expiresIn: string) => {
  return jwt.sign(payload, secret, {
    expiresIn
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as AuthTokenPayload;
};
