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

  async identify({ email, phoneNumber }: IdentifyInput): Promise<IdentifyResult> {
    const byEmail = email ? await this.repo.findByEmail(email) : [];
    const byPhone = phoneNumber
      ? await this.repo.findByPhone(phoneNumber)
      : [];
    const all = [...byEmail, ...byPhone];

    let primary;
    if (all.length === 0) {
      const newContact = await this.repo.create({ email, phoneNumber, linkPrecedence: 'primary' });
      primary = newContact;
    } else {
      primary = all.reduce((oldest, c) =>
        new Date(c.createdAt) < new Date(oldest.createdAt) ? c : oldest
      );
    }

    const linked = all.filter(c => c.linkPrecedence === 'secondary' || c.id === primary.id);
    const emails = Array.from(new Set(linked.map(c => c.email).filter(Boolean))) as string[];
    const phones = Array.from(new Set(linked.map(c => c.phoneNumber).filter(Boolean))) as string[];
    const secondaryIds = linked
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id);

    return {
      primaryContactId: primary.id,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds,
    };
  }
}