export type LinkPrecedence = 'primary' | 'secondary';

export interface Contact {
  id: number;
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: LinkPrecedence;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}