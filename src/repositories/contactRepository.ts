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
      conditions.push(`phone_number = $${values.length}`);
    }

    if (conditions.length === 0) {
      return [];
    }

    const { rows } = await client.query(
      `
      SELECT id, phone_number as "phoneNumber", email, linked_id as "linkedId", 
             link_precedence as "linkPrecedence", created_at as "createdAt", 
             updated_at as "updatedAt", deleted_at as "deletedAt"
      FROM Contact
      WHERE (${conditions.join(' OR ')}) AND deleted_at IS NULL
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
      SELECT id, phone_number as "phoneNumber", email, linked_id as "linkedId", 
             link_precedence as "linkPrecedence", created_at as "createdAt", 
             updated_at as "updatedAt", deleted_at as "deletedAt"
      FROM Contact WHERE id = ANY($1::int[]) AND deleted_at IS NULL
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
          SELECT id, phone_number, email, linked_id, link_precedence, created_at, updated_at, deleted_at
          FROM Contact WHERE id = ANY($1::int[])
          UNION
          SELECT c.id, c.phone_number, c.email, c.linked_id, c.link_precedence, c.created_at, c.updated_at, c.deleted_at
          FROM Contact c
          JOIN contact_cluster cc ON c.id = cc.linked_id OR c.linked_id = cc.id
      )
      SELECT id, phone_number as "phoneNumber", email, linked_id as "linkedId", 
             link_precedence as "linkPrecedence", created_at as "createdAt", 
             updated_at as "updatedAt", deleted_at as "deletedAt"
      FROM contact_cluster WHERE deleted_at IS NULL;
      `,
      [ids]
    );
    return rows;
  }

  async create(
    data: Partial<Contact>,
    client: Pool | PoolClient = pool
  ): Promise<Contact> {
    const fieldMap: { [key: string]: string } = {
      phoneNumber: 'phone_number',
      linkedId: 'linked_id',
      linkPrecedence: 'link_precedence',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    };

    const dbData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      const dbKey = fieldMap[key] || key;
      dbData[dbKey] = value;
    });

    const cols = Object.keys(dbData).join(', ');
    const vals = Object.values(dbData);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    
    const { rows } = await client.query(
      `INSERT INTO Contact(${cols}) VALUES(${placeholders}) 
       RETURNING id, phone_number as "phoneNumber", email, linked_id as "linkedId", 
                 link_precedence as "linkPrecedence", created_at as "createdAt", 
                 updated_at as "updatedAt", deleted_at as "deletedAt"`,
      vals
    );
    return rows[0];
  }

  async update(
    id: number,
    fields: Partial<Contact>,
    client: Pool | PoolClient = pool
  ): Promise<void> {
    const fieldMap: { [key: string]: string } = {
      phoneNumber: 'phone_number',
      linkedId: 'linked_id',
      linkPrecedence: 'link_precedence',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    };

    const dbData: any = {};
    Object.entries(fields).forEach(([key, value]) => {
      const dbKey = fieldMap[key] || key;
      dbData[dbKey] = value;
    });

    const sets = Object.keys(dbData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const vals = Object.values(dbData);
    
    await client.query(
      `UPDATE Contact SET ${sets}, updated_at = NOW() WHERE id = $${
        vals.length + 1
      }`,
      [...vals, id]
    );
  }
}