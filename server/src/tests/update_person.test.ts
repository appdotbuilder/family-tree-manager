import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable } from '../db/schema';
import { type UpdatePersonInput } from '../schema';
import { updatePerson } from '../handlers/update_person';
import { eq } from 'drizzle-orm';

describe('updatePerson', () => {
  let testPersonId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test person to update
    const result = await db.insert(personsTable)
      .values({
        name: 'Original Name',
        birth_date: '1990-01-01' // Use string format for date column
      })
      .returning()
      .execute();
    
    testPersonId = result[0].id;
  });

  afterEach(resetDB);

  it('should update only the name field', async () => {
    const input: UpdatePersonInput = {
      id: testPersonId,
      name: 'Updated Name'
    };

    const result = await updatePerson(input);

    expect(result.id).toEqual(testPersonId);
    expect(result.name).toEqual('Updated Name');
    expect(result.birth_date).toEqual(new Date('1990-01-01'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the update persisted to database
    const dbResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    expect(dbResult[0].name).toEqual('Updated Name');
    expect(dbResult[0].birth_date).toEqual('1990-01-01'); // Database stores as string
  });

  it('should update only the birth_date field', async () => {
    const input: UpdatePersonInput = {
      id: testPersonId,
      birth_date: new Date('1985-05-15')
    };

    const result = await updatePerson(input);

    expect(result.id).toEqual(testPersonId);
    expect(result.name).toEqual('Original Name');
    expect(result.birth_date).toEqual(new Date('1985-05-15'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the update persisted to database
    const dbResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    expect(dbResult[0].name).toEqual('Original Name');
    expect(dbResult[0].birth_date).toEqual('1985-05-15'); // Database stores as string
  });

  it('should update both name and birth_date', async () => {
    const input: UpdatePersonInput = {
      id: testPersonId,
      name: 'Completely New Name',
      birth_date: new Date('1975-12-25')
    };

    const result = await updatePerson(input);

    expect(result.id).toEqual(testPersonId);
    expect(result.name).toEqual('Completely New Name');
    expect(result.birth_date).toEqual(new Date('1975-12-25'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the update persisted to database
    const dbResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    expect(dbResult[0].name).toEqual('Completely New Name');
    expect(dbResult[0].birth_date).toEqual('1975-12-25'); // Database stores as string
  });

  it('should set birth_date to null when provided', async () => {
    const input: UpdatePersonInput = {
      id: testPersonId,
      birth_date: null
    };

    const result = await updatePerson(input);

    expect(result.id).toEqual(testPersonId);
    expect(result.name).toEqual('Original Name');
    expect(result.birth_date).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify the update persisted to database
    const dbResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    expect(dbResult[0].name).toEqual('Original Name');
    expect(dbResult[0].birth_date).toBeNull();
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamps
    const originalPerson = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    const originalUpdatedAt = originalPerson[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdatePersonInput = {
      id: testPersonId,
      name: 'Updated Name'
    };

    const result = await updatePerson(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.created_at).toEqual(originalPerson[0].created_at);
  });

  it('should preserve created_at timestamp', async () => {
    const originalPerson = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, testPersonId))
      .execute();

    const originalCreatedAt = originalPerson[0].created_at;

    const input: UpdatePersonInput = {
      id: testPersonId,
      name: 'Updated Name'
    };

    const result = await updatePerson(input);

    expect(result.created_at).toEqual(originalCreatedAt);
  });

  it('should throw error when person does not exist', async () => {
    const input: UpdatePersonInput = {
      id: 99999, // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updatePerson(input)).rejects.toThrow(/Person with id 99999 not found/i);
  });

  it('should handle person with null birth_date originally', async () => {
    // Create a person with null birth_date
    const result = await db.insert(personsTable)
      .values({
        name: 'Person with null birthdate',
        birth_date: null
      })
      .returning()
      .execute();

    const personWithNullBirthdate = result[0].id;

    const input: UpdatePersonInput = {
      id: personWithNullBirthdate,
      birth_date: new Date('1995-07-10')
    };

    const updatedResult = await updatePerson(input);

    expect(updatedResult.name).toEqual('Person with null birthdate');
    expect(updatedResult.birth_date).toEqual(new Date('1995-07-10'));

    // Verify in database
    const dbResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, personWithNullBirthdate))
      .execute();

    expect(dbResult[0].birth_date).toEqual('1995-07-10'); // Database stores as string
  });

  it('should update person with minimal input (only id)', async () => {
    const input: UpdatePersonInput = {
      id: testPersonId
    };

    const result = await updatePerson(input);

    // Should preserve all original values except updated_at
    expect(result.id).toEqual(testPersonId);
    expect(result.name).toEqual('Original Name');
    expect(result.birth_date).toEqual(new Date('1990-01-01'));
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});