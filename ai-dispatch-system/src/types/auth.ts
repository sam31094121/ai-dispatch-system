import type { 使用者角色 } from '../constants/dictionaries';

export interface User {
  id: number;
  account: string;
  displayName: string;
  roleName: 使用者角色;
}

export interface LoginForm {
  account: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
}
