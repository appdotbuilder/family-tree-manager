import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type PersonWithRelationships } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export async function getPersonRelationships(personId: number): Promise<PersonWithRelationships | null> {
  try {
    // First, fetch the person
    const person = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, personId))
      .execute();

    if (person.length === 0) {
      return null;
    }

    const basePerson = person[0];

    // Query all relationships where this person is involved
    const relationships = await db.select({
      relationship_id: relationshipsTable.id,
      person1_id: relationshipsTable.person1_id,
      person2_id: relationshipsTable.person2_id,
      relationship_type: relationshipsTable.relationship_type,
      other_person: {
        id: personsTable.id,
        name: personsTable.name,
        birth_date: personsTable.birth_date,
        created_at: personsTable.created_at,
        updated_at: personsTable.updated_at
      }
    })
    .from(relationshipsTable)
    .innerJoin(
      personsTable,
      or(
        and(eq(relationshipsTable.person1_id, personId), eq(personsTable.id, relationshipsTable.person2_id)),
        and(eq(relationshipsTable.person2_id, personId), eq(personsTable.id, relationshipsTable.person1_id))
      )
    )
    .where(
      or(
        eq(relationshipsTable.person1_id, personId),
        eq(relationshipsTable.person2_id, personId)
      )
    )
    .execute();

    // Initialize relationship arrays
    const parents: PersonWithRelationships['parents'] = [];
    const children: PersonWithRelationships['children'] = [];
    const spouses: PersonWithRelationships['spouses'] = [];
    const siblings: PersonWithRelationships['siblings'] = [];

    // Process each relationship
    for (const rel of relationships) {
      const otherPerson = {
        ...rel.other_person,
        birth_date: rel.other_person.birth_date ? new Date(rel.other_person.birth_date) : null,
        created_at: new Date(rel.other_person.created_at),
        updated_at: new Date(rel.other_person.updated_at),
        parents: [],
        children: [],
        spouses: [],
        siblings: []
      };

      // Determine relationship direction and type
      if (rel.relationship_type === 'parent') {
        if (rel.person1_id === personId) {
          // This person is person1, so other person is their child
          children.push(otherPerson);
        } else {
          // This person is person2, so other person is their parent
          parents.push(otherPerson);
        }
      } else if (rel.relationship_type === 'spouse') {
        // Spouse relationships are bidirectional
        spouses.push(otherPerson);
      } else if (rel.relationship_type === 'sibling') {
        // Sibling relationships are bidirectional
        siblings.push(otherPerson);
      }
    }

    return {
      id: basePerson.id,
      name: basePerson.name,
      birth_date: basePerson.birth_date ? new Date(basePerson.birth_date) : null,
      created_at: new Date(basePerson.created_at),
      updated_at: new Date(basePerson.updated_at),
      parents,
      children,
      spouses,
      siblings
    };
  } catch (error) {
    console.error('Get person relationships failed:', error);
    throw error;
  }
}