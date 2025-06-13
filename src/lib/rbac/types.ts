/**
 * PosalPro MVP2 - RBAC Types
 * Type definitions for role-based access control
 */

export const Roles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  MANAGER: 'MANAGER',
  SME: 'SME',
  EXECUTIVE: 'EXECUTIVE',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export type Permission =
  | 'CREATE_PROPOSAL'
  | 'EDIT_PROPOSAL'
  | 'DELETE_PROPOSAL'
  | 'VIEW_PROPOSAL'
  | 'APPROVE_PROPOSAL'
  | 'MANAGE_USERS'
  | 'MANAGE_CONTENT'
  | 'MANAGE_PRODUCTS'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_SETTINGS';
