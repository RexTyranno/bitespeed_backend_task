import { Pool, PoolClient } from 'pg';
import { pool } from '../config/database';
import { Contact } from '../models/contact';

export class ContactRepository {
  async findMatchingContacts(
    email: string | undefined,
    phoneNumber: string | undefined,
    client: Pool | PoolClient = pool
  ): Promise<Contact[]> {
    if (!email && !phoneNumber) {
      return [];
    }

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (email) {
      values.push(email);
      conditions.push(`email = $${values.length}`);
    }

    if (phoneNumber) {
      values.push(phoneNumber);
      conditions.push(`"phoneNumber" = $${values.length}`);
    }

    if (conditions.length === 0) {
      return [];
    }

    const { rows } = await client.query(
      `
      SELECT * FROM "Contact"
      WHERE (${conditions.join(' OR ')}) AND "deletedAt" IS NULL
    `,
      values
    );
    return rows;
  }

  async findByIds(
    ids: number[],
    client: Pool | PoolClient = pool
  ): Promise<Contact[]> {
    const { rows } = await client.query(
      `
      SELECT * FROM "Contact" WHERE id = ANY($1::int[]) AND "deletedAt" IS NULL
    `,
      [ids]
    );
    return rows;
  }

  async findAllLinkedByIds(
    ids: number[],
    client: Pool | PoolClient = pool
  ): Promise<Contact[]> {
    if (ids.length === 0) {
      return [];
    }
    const { rows } = await client.query(
      `
      WITH RECURSIVE contact_cluster AS (
          SELECT * FROM "Contact" WHERE id = ANY($1::int[])
          UNION
          SELECT c.*
          FROM "Contact" c
          JOIN contact_cluster cc ON c.id = cc."linkedId" OR c."linkedId" = cc.id
      )
      SELECT * FROM contact_cluster WHERE "deletedAt" IS NULL;
      `,
      [ids]
    );
    return rows;
  }

  async create(
    data: Partial<Contact>,
    client: Pool | PoolClient = pool
  ): Promise<Contact> {
    const cols = Object.keys(data)
      .map(k => `"${k}"`)
      .join(', ');
    const vals = Object.values(data);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await client.query(
      `INSERT INTO "Contact"(${cols}) VALUES(${placeholders}) RETURNING *`,
      vals
    );
    return rows[0];
  }

  async update(
    id: number,
    fields: Partial<Contact>,
    client: Pool | PoolClient = pool
  ): Promise<void> {
    const sets = Object.entries(fields)
      .map(([key], i) => `"${key}" = $${i + 1}`)
      .join(', ');
    const vals = Object.values(fields);
    await client.query(
      `UPDATE "Contact" SET ${sets}, "updatedAt" = NOW() WHERE id = $${
        vals.length + 1
      }`,
      [...vals, id]
    );
  }
}