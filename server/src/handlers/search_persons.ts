import { db } from '../db';
import { personsTable } from '../db/schema';
import { type SearchPersonsInput, type Person } from '../schema';
import { ilike, asc } from 'drizzle-orm';

export async function searchPersons(input: SearchPersonsInput): Promise<Person[]> {
  try {
    // Use case-insensitive LIKE query with wildcards for partial matching
    const results = await db.select()
      .from(personsTable)
      .where(ilike(personsTable.name, `%${input.query}%`))
      .orderBy(asc(personsTable.name)) // Order by name for consistent results
      .execute();

    // Convert birth_date strings to Date objects to match schema
    return results.map(person => ({
      ...person,
      birth_date: person.birth_date ? new Date(person.birth_date) : null
    }));
  } catch (error) {
    console.error('Person search failed:', error);
    throw error;
  }
}