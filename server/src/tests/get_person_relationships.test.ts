import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { getPersonRelationships } from '../handlers/get_person_relationships';

describe('getPersonRelationships', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent person', async () => {
    const result = await getPersonRelationships(999);
    expect(result).toBeNull();
  });

  it('should return person with empty relationships when person has no relationships', async () => {
    // Create a person with no relationships
    const [person] = await db.insert(personsTable)
      .values({
        name: 'John Doe',
        birth_date: '1990-01-01'
      })
      .returning()
      .execute();

    const result = await getPersonRelationships(person.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(person.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.birth_date).toEqual(new Date('1990-01-01'));
    expect(result!.parents).toHaveLength(0);
    expect(result!.children).toHaveLength(0);
    expect(result!.spouses).toHaveLength(0);
    expect(result!.siblings).toHaveLength(0);
  });

  it('should return person with parent relationships', async () => {
    // Create parent and child
    const [parent] = await db.insert(personsTable)
      .values({ name: 'Parent Smith', birth_date: '1960-01-01' })
      .returning()
      .execute();

    const [child] = await db.insert(personsTable)
      .values({ name: 'Child Smith', birth_date: '1990-01-01' })
      .returning()
      .execute();

    // Create parent-child relationship (parent is person1, child is person2)
    await db.insert(relationshipsTable)
      .values({
        person1_id: parent.id,
        person2_id: child.id,
        relationship_type: 'parent'
      })
      .execute();

    // Test from child's perspective (should show parent)
    const childResult = await getPersonRelationships(child.id);
    expect(childResult).not.toBeNull();
    expect(childResult!.parents).toHaveLength(1);
    expect(childResult!.parents[0].name).toEqual('Parent Smith');
    expect(childResult!.children).toHaveLength(0);
    expect(childResult!.spouses).toHaveLength(0);
    expect(childResult!.siblings).toHaveLength(0);

    // Test from parent's perspective (should show child)
    const parentResult = await getPersonRelationships(parent.id);
    expect(parentResult).not.toBeNull();
    expect(parentResult!.children).toHaveLength(1);
    expect(parentResult!.children[0].name).toEqual('Child Smith');
    expect(parentResult!.parents).toHaveLength(0);
    expect(parentResult!.spouses).toHaveLength(0);
    expect(parentResult!.siblings).toHaveLength(0);
  });

  it('should return person with spouse relationships', async () => {
    // Create two spouses
    const [person1] = await db.insert(personsTable)
      .values({ name: 'John Smith', birth_date: '1985-01-01' })
      .returning()
      .execute();

    const [person2] = await db.insert(personsTable)
      .values({ name: 'Jane Smith', birth_date: '1987-01-01' })
      .returning()
      .execute();

    // Create spouse relationship
    await db.insert(relationshipsTable)
      .values({
        person1_id: person1.id,
        person2_id: person2.id,
        relationship_type: 'spouse'
      })
      .execute();

    // Test from person1's perspective
    const person1Result = await getPersonRelationships(person1.id);
    expect(person1Result).not.toBeNull();
    expect(person1Result!.spouses).toHaveLength(1);
    expect(person1Result!.spouses[0].name).toEqual('Jane Smith');
    expect(person1Result!.parents).toHaveLength(0);
    expect(person1Result!.children).toHaveLength(0);
    expect(person1Result!.siblings).toHaveLength(0);

    // Test from person2's perspective
    const person2Result = await getPersonRelationships(person2.id);
    expect(person2Result).not.toBeNull();
    expect(person2Result!.spouses).toHaveLength(1);
    expect(person2Result!.spouses[0].name).toEqual('John Smith');
    expect(person2Result!.parents).toHaveLength(0);
    expect(person2Result!.children).toHaveLength(0);
    expect(person2Result!.siblings).toHaveLength(0);
  });

  it('should return person with sibling relationships', async () => {
    // Create two siblings
    const [sibling1] = await db.insert(personsTable)
      .values({ name: 'Alice Johnson', birth_date: '1990-01-01' })
      .returning()
      .execute();

    const [sibling2] = await db.insert(personsTable)
      .values({ name: 'Bob Johnson', birth_date: '1992-01-01' })
      .returning()
      .execute();

    // Create sibling relationship
    await db.insert(relationshipsTable)
      .values({
        person1_id: sibling1.id,
        person2_id: sibling2.id,
        relationship_type: 'sibling'
      })
      .execute();

    // Test from sibling1's perspective
    const sibling1Result = await getPersonRelationships(sibling1.id);
    expect(sibling1Result).not.toBeNull();
    expect(sibling1Result!.siblings).toHaveLength(1);
    expect(sibling1Result!.siblings[0].name).toEqual('Bob Johnson');
    expect(sibling1Result!.parents).toHaveLength(0);
    expect(sibling1Result!.children).toHaveLength(0);
    expect(sibling1Result!.spouses).toHaveLength(0);

    // Test from sibling2's perspective
    const sibling2Result = await getPersonRelationships(sibling2.id);
    expect(sibling2Result).not.toBeNull();
    expect(sibling2Result!.siblings).toHaveLength(1);
    expect(sibling2Result!.siblings[0].name).toEqual('Alice Johnson');
    expect(sibling2Result!.parents).toHaveLength(0);
    expect(sibling2Result!.children).toHaveLength(0);
    expect(sibling2Result!.spouses).toHaveLength(0);
  });

  it('should return person with multiple relationships of different types', async () => {
    // Create a complex family structure
    const [parent] = await db.insert(personsTable)
      .values({ name: 'Parent Brown', birth_date: '1960-01-01' })
      .returning()
      .execute();

    const [person] = await db.insert(personsTable)
      .values({ name: 'Main Person', birth_date: '1985-01-01' })
      .returning()
      .execute();

    const [spouse] = await db.insert(personsTable)
      .values({ name: 'Spouse Brown', birth_date: '1987-01-01' })
      .returning()
      .execute();

    const [child] = await db.insert(personsTable)
      .values({ name: 'Child Brown', birth_date: '2010-01-01' })
      .returning()
      .execute();

    const [sibling] = await db.insert(personsTable)
      .values({ name: 'Sibling Brown', birth_date: '1983-01-01' })
      .returning()
      .execute();

    // Create all relationships
    await db.insert(relationshipsTable)
      .values([
        { person1_id: parent.id, person2_id: person.id, relationship_type: 'parent' },
        { person1_id: person.id, person2_id: spouse.id, relationship_type: 'spouse' },
        { person1_id: person.id, person2_id: child.id, relationship_type: 'parent' },
        { person1_id: person.id, person2_id: sibling.id, relationship_type: 'sibling' }
      ])
      .execute();

    const result = await getPersonRelationships(person.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(person.id);
    expect(result!.name).toEqual('Main Person');

    // Check all relationship types are present
    expect(result!.parents).toHaveLength(1);
    expect(result!.parents[0].name).toEqual('Parent Brown');

    expect(result!.children).toHaveLength(1);
    expect(result!.children[0].name).toEqual('Child Brown');

    expect(result!.spouses).toHaveLength(1);
    expect(result!.spouses[0].name).toEqual('Spouse Brown');

    expect(result!.siblings).toHaveLength(1);
    expect(result!.siblings[0].name).toEqual('Sibling Brown');
  });

  it('should handle multiple parents and children correctly', async () => {
    // Create a person with multiple parents (adoption scenario) and multiple children
    const [parent1] = await db.insert(personsTable)
      .values({ name: 'Bio Parent', birth_date: '1960-01-01' })
      .returning()
      .execute();

    const [parent2] = await db.insert(personsTable)
      .values({ name: 'Adoptive Parent', birth_date: '1965-01-01' })
      .returning()
      .execute();

    const [person] = await db.insert(personsTable)
      .values({ name: 'Main Person', birth_date: '1985-01-01' })
      .returning()
      .execute();

    const [child1] = await db.insert(personsTable)
      .values({ name: 'First Child', birth_date: '2005-01-01' })
      .returning()
      .execute();

    const [child2] = await db.insert(personsTable)
      .values({ name: 'Second Child', birth_date: '2007-01-01' })
      .returning()
      .execute();

    // Create parent-child relationships
    await db.insert(relationshipsTable)
      .values([
        { person1_id: parent1.id, person2_id: person.id, relationship_type: 'parent' },
        { person1_id: parent2.id, person2_id: person.id, relationship_type: 'parent' },
        { person1_id: person.id, person2_id: child1.id, relationship_type: 'parent' },
        { person1_id: person.id, person2_id: child2.id, relationship_type: 'parent' }
      ])
      .execute();

    const result = await getPersonRelationships(person.id);

    expect(result).not.toBeNull();
    expect(result!.parents).toHaveLength(2);
    expect(result!.children).toHaveLength(2);

    const parentNames = result!.parents.map(p => p.name).sort();
    expect(parentNames).toEqual(['Adoptive Parent', 'Bio Parent']);

    const childNames = result!.children.map(c => c.name).sort();
    expect(childNames).toEqual(['First Child', 'Second Child']);
  });

  it('should handle persons with null birth dates', async () => {
    // Create person with null birth date
    const [person] = await db.insert(personsTable)
      .values({ name: 'No Birth Date', birth_date: null })
      .returning()
      .execute();

    const [parent] = await db.insert(personsTable)
      .values({ name: 'Parent', birth_date: '1960-01-01' })
      .returning()
      .execute();

    await db.insert(relationshipsTable)
      .values({ person1_id: parent.id, person2_id: person.id, relationship_type: 'parent' })
      .execute();

    const result = await getPersonRelationships(person.id);

    expect(result).not.toBeNull();
    expect(result!.birth_date).toBeNull();
    expect(result!.parents).toHaveLength(1);
    expect(result!.parents[0].birth_date).toEqual(new Date('1960-01-01'));
  });
});