import { pool } from '../config/database';
import { Contact } from '../models/contact';
import { ContactRepository } from '../repositories/contactRepository';

interface IdentifyInput {
  email?: string;
  phoneNumber?: string;
}

interface IdentifyResult {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export class IdentifyService {
  private repo = new ContactRepository();

  async identify({
    email,
    phoneNumber,
  }: IdentifyInput): Promise<IdentifyResult> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const matchingContacts = await this.repo.findMatchingContacts(
        email,
        phoneNumber,
        client
      );

      const allContactIds = matchingContacts.map(c => c.id);
      let allContactsInCluster = await this.repo.findAllLinkedByIds(
        allContactIds,
        client
      );

      // Remove duplicates
      allContactsInCluster = allContactsInCluster.filter(
        (contact, index, self) =>
          index === self.findIndex(c => c.id === contact.id)
      );

      if (allContactsInCluster.length === 0) {
        // This is a new customer, create a primary contact
        const newContact = await this.repo.create(
          { email, phoneNumber, linkPrecedence: 'primary' },
          client
        );
        allContactsInCluster.push(newContact);
      } else {
        // This customer is already known, consolidate their identity
        allContactsInCluster.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const primaryContact = allContactsInCluster[0];
        const secondaryContacts = allContactsInCluster.slice(1);

        for (const contact of secondaryContacts) {
          if (contact.linkPrecedence === 'primary') {
            await this.repo.update(
              contact.id,
              {
                linkedId: primaryContact.id,
                linkPrecedence: 'secondary',
              },
              client
            );
            contact.linkedId = primaryContact.id;
            contact.linkPrecedence = 'secondary';
          }
        }

        const hasEmail = allContactsInCluster.some(c => c.email === email);
        const hasPhone = allContactsInCluster.some(
          c => c.phoneNumber === phoneNumber
        );

        if ((email && !hasEmail) || (phoneNumber && !hasPhone)) {
          const newContact = await this.repo.create(
            {
              email,
              phoneNumber,
              linkedId: primaryContact.id,
              linkPrecedence: 'secondary',
            },
            client
          );
          allContactsInCluster.push(newContact);
        }
      }

      const primaryContact = allContactsInCluster.find(
        c => c.linkPrecedence === 'primary'
      ) as Contact;

      const emails = [
        ...new Set(allContactsInCluster.map(c => c.email).filter(Boolean)),
      ] as string[];
      const phoneNumbers = [
        ...new Set(
          allContactsInCluster.map(c => c.phoneNumber).filter(Boolean)
        ),
      ] as string[];
      const secondaryContactIds = allContactsInCluster
        .filter(c => c.id !== primaryContact.id)
        .map(c => c.id);

      await client.query('COMMIT');

      return {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}