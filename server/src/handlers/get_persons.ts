import { db } from '../db';
import { personsTable } from '../db/schema';
import { type Person } from '../schema';
import { asc } from 'drizzle-orm';

export async function getPersons(): Promise<Person[]> {
  try {
    // Query all persons ordered by name
    const results = await db.select()
      .from(personsTable)
      .orderBy(asc(personsTable.name))
      .execute();

    // Return results with proper date conversion
    return results.map(person => ({
      ...person,
      birth_date: person.birth_date ? new Date(person.birth_date) : null,
      created_at: new Date(person.created_at),
      updated_at: new Date(person.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get persons:', error);
    throw error;
  }
}