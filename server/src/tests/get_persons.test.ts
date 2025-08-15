import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable } from '../db/schema';
import { getPersons } from '../handlers/get_persons';

describe('getPersons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no persons exist', async () => {
    const result = await getPersons();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all persons ordered by name', async () => {
    // Create test persons in non-alphabetical order
    await db.insert(personsTable).values([
      {
        name: 'Charlie Brown',
        birth_date: '1990-05-15'
      },
      {
        name: 'Alice Johnson',
        birth_date: '1985-03-20'
      },
      {
        name: 'Bob Smith',
        birth_date: null
      }
    ]).execute();

    const result = await getPersons();

    // Should return 3 persons
    expect(result).toHaveLength(3);

    // Should be ordered by name (Alice, Bob, Charlie)
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[1].name).toEqual('Bob Smith');
    expect(result[2].name).toEqual('Charlie Brown');

    // Verify all required fields are present
    result.forEach(person => {
      expect(person.id).toBeDefined();
      expect(person.name).toBeDefined();
      expect(person.created_at).toBeInstanceOf(Date);
      expect(person.updated_at).toBeInstanceOf(Date);
      // birth_date can be null, so check it's either Date or null
      expect(person.birth_date === null || person.birth_date instanceof Date).toBe(true);
    });
  });

  it('should handle persons with and without birth_date correctly', async () => {
    // Create persons with different birth_date scenarios
    await db.insert(personsTable).values([
      {
        name: 'Person With Birth Date',
        birth_date: '1995-12-25'
      },
      {
        name: 'Person Without Birth Date',
        birth_date: null
      }
    ]).execute();

    const result = await getPersons();

    expect(result).toHaveLength(2);

    // Find persons by name
    const personWithBirthDate = result.find(p => p.name === 'Person With Birth Date');
    const personWithoutBirthDate = result.find(p => p.name === 'Person Without Birth Date');

    // Verify birth_date handling
    expect(personWithBirthDate?.birth_date).toBeInstanceOf(Date);
    expect(personWithBirthDate?.birth_date?.getFullYear()).toEqual(1995);
    expect(personWithBirthDate?.birth_date?.getMonth()).toEqual(11); // December is month 11
    expect(personWithBirthDate?.birth_date?.getDate()).toEqual(25);

    expect(personWithoutBirthDate?.birth_date).toBeNull();
  });

  it('should handle large datasets efficiently', async () => {
    // Create multiple persons to test ordering and performance
    const personsData = [];
    for (let i = 1; i <= 10; i++) {
      personsData.push({
        name: `Person ${String(i).padStart(2, '0')}`, // Person 01, Person 02, etc.
        birth_date: i % 3 === 0 ? null : `199${i % 10}-01-01`
      });
    }

    await db.insert(personsTable).values(personsData).execute();

    const result = await getPersons();

    expect(result).toHaveLength(10);

    // Verify ordering - should be alphabetically sorted
    expect(result[0].name).toEqual('Person 01');
    expect(result[1].name).toEqual('Person 02');
    expect(result[9].name).toEqual('Person 10');

    // Verify all have proper timestamp fields
    result.forEach(person => {
      expect(person.created_at).toBeInstanceOf(Date);
      expect(person.updated_at).toBeInstanceOf(Date);
      expect(person.created_at.getTime()).toBeLessThanOrEqual(Date.now());
      expect(person.updated_at.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  it('should maintain data integrity across multiple calls', async () => {
    // Insert test data
    await db.insert(personsTable).values({
      name: 'Test Person',
      birth_date: '2000-01-01'
    }).execute();

    // Call handler multiple times
    const result1 = await getPersons();
    const result2 = await getPersons();
    const result3 = await getPersons();

    // Results should be identical
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(result1).toHaveLength(1);

    // Verify the person data is consistent
    expect(result1[0].name).toEqual('Test Person');
    expect(result1[0].birth_date).toBeInstanceOf(Date);
    expect(result1[0].birth_date?.getFullYear()).toEqual(2000);
  });
});