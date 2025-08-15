import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable } from '../db/schema';
import { type CreatePersonInput } from '../schema';
import { createPerson } from '../handlers/create_person';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreatePersonInput = {
  name: 'John Doe',
  birth_date: new Date('1990-05-15')
};

describe('createPerson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a person with birth date', async () => {
    const result = await createPerson(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.birth_date).toEqual(new Date('1990-05-15'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a person without birth date', async () => {
    const inputWithoutBirthDate: CreatePersonInput = {
      name: 'Jane Smith',
      birth_date: null
    };

    const result = await createPerson(inputWithoutBirthDate);

    expect(result.name).toEqual('Jane Smith');
    expect(result.birth_date).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save person to database', async () => {
    const result = await createPerson(testInput);

    // Query using proper drizzle syntax
    const persons = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, result.id))
      .execute();

    expect(persons).toHaveLength(1);
    expect(persons[0].name).toEqual('John Doe');
    expect(persons[0].birth_date).toEqual('1990-05-15');
    expect(persons[0].created_at).toBeInstanceOf(Date);
    expect(persons[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique IDs for multiple persons', async () => {
    const input1: CreatePersonInput = {
      name: 'Person One',
      birth_date: new Date('1985-01-01')
    };

    const input2: CreatePersonInput = {
      name: 'Person Two',
      birth_date: new Date('1990-12-31')
    };

    const person1 = await createPerson(input1);
    const person2 = await createPerson(input2);

    expect(person1.id).not.toEqual(person2.id);
    expect(person1.name).toEqual('Person One');
    expect(person2.name).toEqual('Person Two');
    expect(person1.birth_date).toEqual(new Date('1985-01-01'));
    expect(person2.birth_date).toEqual(new Date('1990-12-31'));
  });

  it('should handle creation timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createPerson(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should verify data persists in database correctly', async () => {
    await createPerson(testInput);

    // Verify all persons in database
    const allPersons = await db.select()
      .from(personsTable)
      .execute();

    expect(allPersons).toHaveLength(1);
    expect(allPersons[0].name).toEqual('John Doe');
    expect(allPersons[0].birth_date).toEqual('1990-05-15');
  });
});