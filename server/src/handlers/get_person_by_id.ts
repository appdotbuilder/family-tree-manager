import { db } from '../db';
import { personsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Person } from '../schema';

export async function getPersonById(id: number): Promise<Person | null> {
  try {
    const result = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, id))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const person = result[0];
    return {
      ...person,
      birth_date: person.birth_date ? new Date(person.birth_date) : null
    };
  } catch (error) {
    console.error('Get person by ID failed:', error);
    throw error;
  }
}