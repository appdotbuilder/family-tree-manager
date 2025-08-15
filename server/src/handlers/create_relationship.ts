import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type CreateRelationshipInput, type Relationship } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export async function createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
  try {
    // Validate that both persons exist
    const persons = await db.select()
      .from(personsTable)
      .where(
        or(
          eq(personsTable.id, input.person1_id),
          eq(personsTable.id, input.person2_id)
        )
      )
      .execute();

    if (persons.length !== 2) {
      throw new Error('One or both persons do not exist');
    }

    // Check for existing relationship to prevent duplicates
    const existingRelationships = await db.select()
      .from(relationshipsTable)
      .where(
        or(
          and(
            eq(relationshipsTable.person1_id, input.person1_id),
            eq(relationshipsTable.person2_id, input.person2_id),
            eq(relationshipsTable.relationship_type, input.relationship_type)
          ),
          and(
            eq(relationshipsTable.person1_id, input.person2_id),
            eq(relationshipsTable.person2_id, input.person1_id),
            eq(relationshipsTable.relationship_type, input.relationship_type)
          )
        )
      )
      .execute();

    if (existingRelationships.length > 0) {
      throw new Error('Relationship already exists');
    }

    // Create the primary relationship
    const primaryResult = await db.insert(relationshipsTable)
      .values({
        person1_id: input.person1_id,
        person2_id: input.person2_id,
        relationship_type: input.relationship_type
      })
      .returning()
      .execute();

    const primaryRelationship = primaryResult[0];

    // Create bidirectional relationships based on type
    if (input.relationship_type === 'spouse' || input.relationship_type === 'sibling') {
      // For spouse and sibling relationships, create mutual relationship
      await db.insert(relationshipsTable)
        .values({
          person1_id: input.person2_id,
          person2_id: input.person1_id,
          relationship_type: input.relationship_type
        })
        .execute();
    } else if (input.relationship_type === 'parent') {
      // For parent relationship, create reverse child relationship
      // Note: We don't have a 'child' enum value, so we create parent->child
      // The relationship semantics are: person1 is parent of person2
      // So we don't need to create a reverse relationship as the direction is implicit
    }

    return {
      id: primaryRelationship.id,
      person1_id: primaryRelationship.person1_id,
      person2_id: primaryRelationship.person2_id,
      relationship_type: primaryRelationship.relationship_type,
      created_at: primaryRelationship.created_at
    };
  } catch (error) {
    console.error('Relationship creation failed:', error);
    throw error;
  }
}