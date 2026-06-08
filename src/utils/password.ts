import bcrypt from 'bcryptjs';

export const hashPassword = (password: string, saltRounds: number) => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
