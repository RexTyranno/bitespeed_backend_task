import pool from '../config/database';
import { Contact, LinkPrecedence } from '../models/contact';

export class ContactRepository {
  async findByEmail(email: string): Promise<Contact[]> {
    const { rows } = await pool.query(`
      SELECT * FROM "Contact" WHERE email = $1 AND deletedAt IS NULL
    `, [email]);
    return rows;
  }

  async findByPhone(phoneNumber: string): Promise<Contact[]> {
    const { rows } = await pool.query(`
      SELECT * FROM "Contact" WHERE phoneNumber = $1 AND deletedAt IS NULL
    `, [phoneNumber]);
    return rows;
  }

  async create(data: Partial<Contact>): Promise<Contact> {
    const cols = Object.keys(data).join(', ');
    const vals = Object.values(data);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `INSERT INTO "Contact"(${cols}) VALUES(${placeholders}) RETURNING *`,
      vals
    );
    return rows[0];
  }

  async update(id: number, fields: Partial<Contact>): Promise<void> {
    const sets = Object.entries(fields)
      .map(([key], i) => `"${key}" = $${i + 1}`)
      .join(', ');
    const vals = Object.values(fields);
    await pool.query(
      `UPDATE "Contact" SET ${sets}, "updatedAt" = NOW() WHERE id = $${
        vals.length + 1
      }`,
      [...vals, id]
    );
  }
}