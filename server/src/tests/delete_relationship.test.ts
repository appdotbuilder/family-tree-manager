import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type DeleteRelationshipInput } from '../schema';
import { deleteRelationship } from '../handlers/delete_relationship';
import { eq, and, or } from 'drizzle-orm';

// Test data
const person1Input = {
  name: 'John Doe',
  birth_date: '1980-01-01'
};

const person2Input = {
  name: 'Jane Smith',
  birth_date: '1985-02-15'
};

const person3Input = {
  name: 'Bob Johnson',
  birth_date: '1990-03-20'
};

describe('deleteRelationship', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a bidirectional relationship successfully', async () => {
    // Create persons
    const [person1] = await db.insert(personsTable)
      .values(person1Input)
      .returning();
    
    const [person2] = await db.insert(personsTable)
      .values(person2Input)
      .returning();

    // Create bidirectional parent-child relationship
    await db.insert(relationshipsTable).values([
      {
        person1_id: person1.id,
        person2_id: person2.id,
        relationship_type: 'parent'
      },
      {
        person1_id: person2.id,
        person2_id: person1.id,
        relationship_type: 'parent'
      }
    ]);

    // Delete the relationship
    const deleteInput: DeleteRelationshipInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      relationship_type: 'parent'
    };

    const result = await deleteRelationship(deleteInput);

    // Verify success
    expect(result.success).toBe(true);

    // Verify both directions were deleted
    const remainingRelationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.relationship_type, 'parent'),
          or(
            and(
              eq(relationshipsTable.person1_id, person1.id),
              eq(relationshipsTable.person2_id, person2.id)
            ),
            and(
              eq(relationshipsTable.person1_id, person2.id),
              eq(relationshipsTable.person2_id, person1.id)
            )
          )
        )
      );

    expect(remainingRelationships).toHaveLength(0);
  });

  it('should return success false when no relationships exist to delete', async () => {
    // Create persons but no relationships
    const [person1] = await db.insert(personsTable)
      .values(person1Input)
      .returning();
    
    const [person2] = await db.insert(personsTable)
      .values(person2Input)
      .returning();

    // Try to delete non-existent relationship
    const deleteInput: DeleteRelationshipInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      relationship_type: 'parent'
    };

    const result = await deleteRelationship(deleteInput);

    // Verify failure
    expect(result.success).toBe(false);
  });

  it('should only delete relationships of the specified type', async () => {
    // Create persons
    const [person1] = await db.insert(personsTable)
      .values(person1Input)
      .returning();
    
    const [person2] = await db.insert(personsTable)
      .values(person2Input)
      .returning();

    // Create multiple relationship types between the same persons
    await db.insert(relationshipsTable).values([
      // Parent relationship (bidirectional)
      {
        person1_id: person1.id,
        person2_id: person2.id,
        relationship_type: 'parent'
      },
      {
        person1_id: person2.id,
        person2_id: person1.id,
        relationship_type: 'parent'
      },
      // Sibling relationship (bidirectional)
      {
        person1_id: person1.id,
        person2_id: person2.id,
        relationship_type: 'sibling'
      },
      {
        person1_id: person2.id,
        person2_id: person1.id,
        relationship_type: 'sibling'
      }
    ]);

    // Delete only parent relationship
    const deleteInput: DeleteRelationshipInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      relationship_type: 'parent'
    };

    const result = await deleteRelationship(deleteInput);

    // Verify success
    expect(result.success).toBe(true);

    // Verify parent relationships were deleted
    const parentRelationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.relationship_type, 'parent'));

    expect(parentRelationships).toHaveLength(0);

    // Verify sibling relationships still exist
    const siblingRelationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.relationship_type, 'sibling'));

    expect(siblingRelationships).toHaveLength(2);
  });

  it('should work when relationship exists in reverse direction only', async () => {
    // Create persons
    const [person1] = await db.insert(personsTable)
      .values(person1Input)
      .returning();
    
    const [person2] = await db.insert(personsTable)
      .values(person2Input)
      .returning();

    // Create relationship in one direction only
    await db.insert(relationshipsTable).values({
      person1_id: person2.id,
      person2_id: person1.id,
      relationship_type: 'spouse'
    });

    // Delete using opposite direction in input
    const deleteInput: DeleteRelationshipInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      relationship_type: 'spouse'
    };

    const result = await deleteRelationship(deleteInput);

    // Verify success
    expect(result.success).toBe(true);

    // Verify relationship was deleted
    const remainingRelationships = await db.select()
      .from(relationshipsTable)
      .where(eq(relationshipsTable.relationship_type, 'spouse'));

    expect(remainingRelationships).toHaveLength(0);
  });

  it('should not delete relationships involving other persons', async () => {
    // Create three persons
    const [person1] = await db.insert(personsTable)
      .values(person1Input)
      .returning();
    
    const [person2] = await db.insert(personsTable)
      .values(person2Input)
      .returning();

    const [person3] = await db.insert(personsTable)
      .values(person3Input)
      .returning();

    // Create relationships: person1-person2 and person1-person3
    await db.insert(relationshipsTable).values([
      {
        person1_id: person1.id,
        person2_id: person2.id,
        relationship_type: 'sibling'
      },
      {
        person1_id: person1.id,
        person2_id: person3.id,
        relationship_type: 'sibling'
      }
    ]);

    // Delete person1-person2 relationship
    const deleteInput: DeleteRelationshipInput = {
      person1_id: person1.id,
      person2_id: person2.id,
      relationship_type: 'sibling'
    };

    const result = await deleteRelationship(deleteInput);

    // Verify success
    expect(result.success).toBe(true);

    // Verify person1-person3 relationship still exists
    const remainingRelationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.person1_id, person1.id),
          eq(relationshipsTable.person2_id, person3.id)
        )
      );

    expect(remainingRelationships).toHaveLength(1);

    // Verify person1-person2 relationship was deleted
    const deletedRelationships = await db.select()
      .from(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.relationship_type, 'sibling'),
          or(
            and(
              eq(relationshipsTable.person1_id, person1.id),
              eq(relationshipsTable.person2_id, person2.id)
            ),
            and(
              eq(relationshipsTable.person1_id, person2.id),
              eq(relationshipsTable.person2_id, person1.id)
            )
          )
        )
      );

    expect(deletedRelationships).toHaveLength(0);
  });
});