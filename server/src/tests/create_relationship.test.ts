import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type CreateRelationshipInput } from '../schema';
import { createRelationship } from '../handlers/create_relationship';
import { eq, and, or } from 'drizzle-orm';

describe('createRelationship', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let person1Id: number;
  let person2Id: number;
  let person3Id: number;

  beforeEach(async () => {
    // Create test persons
    const persons = await db.insert(personsTable)
      .values([
        { name: 'Alice', birth_date: '1980-01-01' },
        { name: 'Bob', birth_date: '1975-06-15' },
        { name: 'Charlie', birth_date: '2005-03-10' }
      ])
      .returning()
      .execute();

    person1Id = persons[0].id;
    person2Id = persons[1].id;
    person3Id = persons[2].id;
  });

  it('should create a parent relationship', async () => {
    const input: CreateRelationshipInput = {
      person1_id: person1Id, // Alice is parent
      person2_id: person3Id, // Charlie is child
      relationship_type: 'parent'
    };

    const result = await createRelationship(input);

    expect(result.person1_id).toBe(person1Id);
    expect(result.person2_id).toBe(person3Id);
    expect(result.relationship_type).toBe('parent');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify it was saved to database
    const relationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.id, result.id))
      .execute();

    expect(relationships).toHaveLength(1);
    expect(relationships[0].person1_id).toBe(person1Id);
    expect(relationships[0].person2_id).toBe(person3Id);
    expect(relationships[0].relationship_type).toBe('parent');
  });

  it('should create bidirectional spouse relationships', async () => {
    const input: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'spouse'
    };

    const result = await createRelationship(input);

    expect(result.person1_id).toBe(person1Id);
    expect(result.person2_id).toBe(person2Id);
    expect(result.relationship_type).toBe('spouse');

    // Verify both relationships exist in database
    const relationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.relationship_type, 'spouse'),
          or(
            and(
              eq(relationshipsTable.person1_id, person1Id),
              eq(relationshipsTable.person2_id, person2Id)
            ),
            and(
              eq(relationshipsTable.person1_id, person2Id),
              eq(relationshipsTable.person2_id, person1Id)
            )
          )
        )
      )
      .execute();

    expect(relationships).toHaveLength(2);
    
    // Check that we have both directions
    const relationship1to2 = relationships.find(r => 
      r.person1_id === person1Id && r.person2_id === person2Id
    );
    const relationship2to1 = relationships.find(r => 
      r.person1_id === person2Id && r.person2_id === person1Id
    );

    expect(relationship1to2).toBeDefined();
    expect(relationship2to1).toBeDefined();
  });

  it('should create bidirectional sibling relationships', async () => {
    const input: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'sibling'
    };

    const result = await createRelationship(input);

    expect(result.person1_id).toBe(person1Id);
    expect(result.person2_id).toBe(person2Id);
    expect(result.relationship_type).toBe('sibling');

    // Verify both relationships exist in database
    const relationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.relationship_type, 'sibling'),
          or(
            and(
              eq(relationshipsTable.person1_id, person1Id),
              eq(relationshipsTable.person2_id, person2Id)
            ),
            and(
              eq(relationshipsTable.person1_id, person2Id),
              eq(relationshipsTable.person2_id, person1Id)
            )
          )
        )
      )
      .execute();

    expect(relationships).toHaveLength(2);

    // Check that we have both directions
    const relationship1to2 = relationships.find(r => 
      r.person1_id === person1Id && r.person2_id === person2Id
    );
    const relationship2to1 = relationships.find(r => 
      r.person1_id === person2Id && r.person2_id === person1Id
    );

    expect(relationship1to2).toBeDefined();
    expect(relationship2to1).toBeDefined();
  });

  it('should throw error when person1 does not exist', async () => {
    const input: CreateRelationshipInput = {
      person1_id: 99999, // Non-existent person
      person2_id: person2Id,
      relationship_type: 'parent'
    };

    await expect(createRelationship(input)).rejects.toThrow(/do not exist/i);
  });

  it('should throw error when person2 does not exist', async () => {
    const input: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: 99999, // Non-existent person
      relationship_type: 'parent'
    };

    await expect(createRelationship(input)).rejects.toThrow(/do not exist/i);
  });

  it('should throw error when both persons do not exist', async () => {
    const input: CreateRelationshipInput = {
      person1_id: 99998,
      person2_id: 99999,
      relationship_type: 'parent'
    };

    await expect(createRelationship(input)).rejects.toThrow(/do not exist/i);
  });

  it('should prevent duplicate relationships', async () => {
    const input: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'spouse'
    };

    // Create the relationship first time
    await createRelationship(input);

    // Attempt to create the same relationship again
    await expect(createRelationship(input)).rejects.toThrow(/already exists/i);
  });

  it('should prevent duplicate relationships in reverse order', async () => {
    const input1: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'sibling'
    };

    const input2: CreateRelationshipInput = {
      person1_id: person2Id, // Reversed order
      person2_id: person1Id,
      relationship_type: 'sibling'
    };

    // Create the relationship first time
    await createRelationship(input1);

    // Attempt to create the reverse relationship (should fail)
    await expect(createRelationship(input2)).rejects.toThrow(/already exists/i);
  });

  it('should allow different relationship types between same persons', async () => {
    // First create a sibling relationship
    const siblingInput: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'sibling'
    };

    await createRelationship(siblingInput);

    // Then create a spouse relationship between the same people
    const spouseInput: CreateRelationshipInput = {
      person1_id: person1Id,
      person2_id: person2Id,
      relationship_type: 'spouse'
    };

    const result = await createRelationship(spouseInput);

    expect(result.relationship_type).toBe('spouse');

    // Verify we have both relationship types in database
    const allRelationships = await db.select()
      .from(relationshipsTable)
      .where(
        or(
          and(
            eq(relationshipsTable.person1_id, person1Id),
            eq(relationshipsTable.person2_id, person2Id)
          ),
          and(
            eq(relationshipsTable.person1_id, person2Id),
            eq(relationshipsTable.person2_id, person1Id)
          )
        )
      )
      .execute();

    const relationshipTypes = [...new Set(allRelationships.map(r => r.relationship_type))];
    expect(relationshipTypes).toContain('sibling');
    expect(relationshipTypes).toContain('spouse');
  });
});