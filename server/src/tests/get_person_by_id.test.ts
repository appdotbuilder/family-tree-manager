import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable } from '../db/schema';
import { getPersonById } from '../handlers/get_person_by_id';

describe('getPersonById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a person when found by ID', async () => {
    // Create test person
    const testPerson = {
      name: 'John Doe',
      birth_date: '1990-05-15'
    };

    const insertResult = await db.insert(personsTable)
      .values(testPerson)
      .returning()
      .execute();

    const createdPerson = insertResult[0];

    // Test the handler
    const result = await getPersonById(createdPerson.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPerson.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.birth_date).toEqual(new Date('1990-05-15'));
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when person is not found', async () => {
    const result = await getPersonById(999999);
    
    expect(result).toBeNull();
  });

  it('should handle person with null birth_date', async () => {
    // Create test person with null birth_date
    const testPerson = {
      name: 'Jane Smith',
      birth_date: null
    };

    const insertResult = await db.insert(personsTable)
      .values(testPerson)
      .returning()
      .execute();

    const createdPerson = insertResult[0];

    // Test the handler
    const result = await getPersonById(createdPerson.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPerson.id);
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.birth_date).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the correct person when multiple persons exist', async () => {
    // Create multiple test persons
    const persons = [
      { name: 'Alice Johnson', birth_date: '1985-03-20' },
      { name: 'Bob Wilson', birth_date: '1992-11-08' },
      { name: 'Charlie Brown', birth_date: null }
    ];

    const insertResults = await db.insert(personsTable)
      .values(persons)
      .returning()
      .execute();

    // Test getting the middle person
    const targetPerson = insertResults[1];
    const result = await getPersonById(targetPerson.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetPerson.id);
    expect(result!.name).toEqual('Bob Wilson');
    expect(result!.birth_date).toEqual(new Date('1992-11-08'));
  });

  it('should handle negative ID values gracefully', async () => {
    const result = await getPersonById(-1);
    
    expect(result).toBeNull();
  });

  it('should handle zero ID value gracefully', async () => {
    const result = await getPersonById(0);
    
    expect(result).toBeNull();
  });
});