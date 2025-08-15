import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable } from '../db/schema';
import { type SearchPersonsInput, type CreatePersonInput } from '../schema';
import { searchPersons } from '../handlers/search_persons';

describe('searchPersons', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test persons
  const createTestPerson = async (input: CreatePersonInput) => {
    const result = await db.insert(personsTable)
      .values({
        name: input.name,
        birth_date: input.birth_date ? input.birth_date.toISOString().split('T')[0] : null
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should find persons by exact name match', async () => {
    // Create test data
    await createTestPerson({ name: 'John Doe', birth_date: null });
    await createTestPerson({ name: 'Jane Smith', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'John Doe'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('John Doe');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should find persons by partial name match', async () => {
    // Create test data
    await createTestPerson({ name: 'John Doe', birth_date: null });
    await createTestPerson({ name: 'John Smith', birth_date: null });
    await createTestPerson({ name: 'Jane Doe', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'John'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(2);
    expect(results.map(p => p.name)).toContain('John Doe');
    expect(results.map(p => p.name)).toContain('John Smith');
    expect(results.map(p => p.name)).not.toContain('Jane Doe');
  });

  it('should perform case-insensitive search', async () => {
    // Create test data
    await createTestPerson({ name: 'John Doe', birth_date: null });
    await createTestPerson({ name: 'jane smith', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'JOHN'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('John Doe');
  });

  it('should search within any part of the name', async () => {
    // Create test data
    await createTestPerson({ name: 'John Doe', birth_date: null });
    await createTestPerson({ name: 'Jane Smith', birth_date: null });
    await createTestPerson({ name: 'Michael Johnson', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'ohn'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(2);
    expect(results.map(p => p.name)).toContain('John Doe');
    expect(results.map(p => p.name)).toContain('Michael Johnson');
    expect(results.map(p => p.name)).not.toContain('Jane Smith');
  });

  it('should return results ordered by name', async () => {
    // Create test data in random order
    await createTestPerson({ name: 'Zoe Wilson', birth_date: null });
    await createTestPerson({ name: 'Alice Johnson', birth_date: null });
    await createTestPerson({ name: 'Bob Smith', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'o' // Should match all three (Zoe, Johnson, Bob)
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(3);
    // Results should be ordered alphabetically by name
    expect(results[0].name).toEqual('Alice Johnson');
    expect(results[1].name).toEqual('Bob Smith');
    expect(results[2].name).toEqual('Zoe Wilson');
  });

  it('should return empty array when no matches found', async () => {
    // Create test data
    await createTestPerson({ name: 'John Doe', birth_date: null });
    await createTestPerson({ name: 'Jane Smith', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'NonExistent'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should handle special characters in search query', async () => {
    // Create test data with special characters
    await createTestPerson({ name: "O'Connor", birth_date: null });
    await createTestPerson({ name: 'Smith-Johnson', birth_date: null });
    await createTestPerson({ name: 'John Doe', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: "O'Connor"
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual("O'Connor");
  });

  it('should include all person fields in results', async () => {
    // Create test data with birth date
    const testBirthDate = new Date('1990-05-15');
    await createTestPerson({ 
      name: 'John Doe', 
      birth_date: testBirthDate 
    });
    
    const input: SearchPersonsInput = {
      query: 'John'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(1);
    const person = results[0];
    
    expect(person.id).toBeDefined();
    expect(typeof person.id).toBe('number');
    expect(person.name).toEqual('John Doe');
    expect(person.birth_date).toBeInstanceOf(Date);
    expect(person.birth_date?.toISOString().split('T')[0]).toEqual('1990-05-15');
    expect(person.created_at).toBeInstanceOf(Date);
    expect(person.updated_at).toBeInstanceOf(Date);
  });

  it('should handle persons with null birth dates', async () => {
    // Create test data with null birth date
    await createTestPerson({ name: 'John Doe', birth_date: null });
    
    const input: SearchPersonsInput = {
      query: 'John'
    };

    const results = await searchPersons(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('John Doe');
    expect(results[0].birth_date).toBeNull();
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });
});