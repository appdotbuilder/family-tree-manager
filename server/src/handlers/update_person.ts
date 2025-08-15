import { db } from '../db';
import { personsTable } from '../db/schema';
import { type UpdatePersonInput, type Person } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePerson = async (input: UpdatePersonInput): Promise<Person> => {
  try {
    // First, check if the person exists
    const existingPerson = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, input.id))
      .execute();

    if (existingPerson.length === 0) {
      throw new Error(`Person with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.birth_date !== undefined) {
      // Convert Date to ISO date string format for database storage
      updateData.birth_date = input.birth_date ? input.birth_date.toISOString().split('T')[0] : null;
    }

    // Update the person
    const result = await db.update(personsTable)
      .set(updateData)
      .where(eq(personsTable.id, input.id))
      .returning()
      .execute();

    // Convert date string to Date object for birth_date
    const person = result[0];
    return {
      ...person,
      birth_date: person.birth_date ? new Date(person.birth_date) : null
    };
  } catch (error) {
    console.error('Person update failed:', error);
    throw error;
  }
};