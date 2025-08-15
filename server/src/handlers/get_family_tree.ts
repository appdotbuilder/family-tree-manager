import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type FamilyTreeViewInput, type FamilyTreeData, type PersonWithRelationships } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export async function getFamilyTree(input: FamilyTreeViewInput): Promise<FamilyTreeData | null> {
  try {
    // First, verify the center person exists
    const centerPersonResult = await db.select()
      .from(personsTable)
      .where(eq(personsTable.id, input.person_id))
      .execute();

    if (centerPersonResult.length === 0) {
      return null;
    }

    const centerPerson = centerPersonResult[0];

    // Get the center person with all relationships
    const centerPersonWithRelationships = await getPersonWithRelationships(centerPerson.id);

    // Get grandparents (parents of parents)
    const grandparents: PersonWithRelationships[] = [];
    for (const parent of centerPersonWithRelationships.parents) {
      const grandparentsOfParent = await getPersonWithRelationships(parent.id);
      grandparents.push(grandparentsOfParent);
    }

    // Get grandchildren (children of children)
    const grandchildren: PersonWithRelationships[] = [];
    for (const child of centerPersonWithRelationships.children) {
      const grandchildrenOfChild = await getPersonWithRelationships(child.id);
      grandchildren.push(grandchildrenOfChild);
    }

    return {
      center_person: centerPersonWithRelationships,
      grandparents: grandparents,
      grandchildren: grandchildren
    };
  } catch (error) {
    console.error('Get family tree failed:', error);
    throw error;
  }
}

// Helper function to get a person with all their relationships
async function getPersonWithRelationships(personId: number): Promise<PersonWithRelationships> {
  // Get the person
  const personResult = await db.select()
    .from(personsTable)
    .where(eq(personsTable.id, personId))
    .execute();

  const person = personResult[0];

  // Get all relationships where this person is involved
  const relationshipsResult = await db.select()
    .from(relationshipsTable)
    .innerJoin(personsTable, or(
      eq(relationshipsTable.person1_id, personsTable.id),
      eq(relationshipsTable.person2_id, personsTable.id)
    ))
    .where(or(
      eq(relationshipsTable.person1_id, personId),
      eq(relationshipsTable.person2_id, personId)
    ))
    .execute();

  // Process relationships to categorize them
  const parents: any[] = [];
  const children: any[] = [];
  const spouses: any[] = [];
  const siblings: any[] = [];

  for (const result of relationshipsResult) {
    const relationship = result.relationships;
    const relatedPerson = result.persons;

    // Skip if this is the same person (shouldn't happen but safety check)
    if (relatedPerson.id === personId) {
      continue;
    }

    // Determine the relationship type and direction
    if (relationship.relationship_type === 'parent') {
      if (relationship.person1_id === personId) {
        // This person is person1, so related person is their child
        children.push(relatedPerson);
      } else {
        // This person is person2, so related person is their parent
        parents.push(relatedPerson);
      }
    } else if (relationship.relationship_type === 'spouse') {
      spouses.push(relatedPerson);
    } else if (relationship.relationship_type === 'sibling') {
      siblings.push(relatedPerson);
    }
  }

  return {
    id: person.id,
    name: person.name,
    birth_date: person.birth_date ? new Date(person.birth_date) : null,
    created_at: person.created_at,
    updated_at: person.updated_at,
    parents: parents.map(p => ({
      ...p,
      birth_date: p.birth_date ? new Date(p.birth_date) : null
    })),
    children: children.map(p => ({
      ...p,
      birth_date: p.birth_date ? new Date(p.birth_date) : null
    })),
    spouses: spouses.map(p => ({
      ...p,
      birth_date: p.birth_date ? new Date(p.birth_date) : null
    })),
    siblings: siblings.map(p => ({
      ...p,
      birth_date: p.birth_date ? new Date(p.birth_date) : null
    }))
  };
}