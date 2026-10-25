export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export interface JwtPayload {
  sub: string;
  merchantId: string | null;
  storeId: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RequestUser extends JwtPayload {
  // alias for clarity in controllers
}
