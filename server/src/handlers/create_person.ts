import { db } from '../db';
import { personsTable } from '../db/schema';
import { type CreatePersonInput, type Person } from '../schema';

export const createPerson = async (input: CreatePersonInput): Promise<Person> => {
  try {
    // Insert person record
    const result = await db.insert(personsTable)
      .values({
        name: input.name,
        birth_date: input.birth_date ? input.birth_date.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const person = result[0];
    return {
      ...person,
      birth_date: person.birth_date ? new Date(person.birth_date) : null
    };
  } catch (error) {
    console.error('Person creation failed:', error);
    throw error;
  }
};