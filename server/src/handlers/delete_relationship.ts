import { db } from '../db';
import { relationshipsTable } from '../db/schema';
import { type DeleteRelationshipInput } from '../schema';
import { and, or, eq } from 'drizzle-orm';

export async function deleteRelationship(input: DeleteRelationshipInput): Promise<{ success: boolean }> {
  try {
    // Delete bidirectional relationships between the two persons with the specified relationship type
    // This handles both person1->person2 and person2->person1 relationships
    const result = await db.delete(relationshipsTable)
      .where(
        and(
          eq(relationshipsTable.relationship_type, input.relationship_type),
          or(
            and(
              eq(relationshipsTable.person1_id, input.person1_id),
              eq(relationshipsTable.person2_id, input.person2_id)
            ),
            and(
              eq(relationshipsTable.person1_id, input.person2_id),
              eq(relationshipsTable.person2_id, input.person1_id)
            )
          )
        )
      )
      .execute();

    // Return success status based on whether any relationships were actually deleted
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Relationship deletion failed:', error);
    throw error;
  }
}