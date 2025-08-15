import { z } from 'zod';

// Person schema
export const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  birth_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Person = z.infer<typeof personSchema>;

// Input schema for creating persons
export const createPersonInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birth_date: z.coerce.date().nullable()
});

export type CreatePersonInput = z.infer<typeof createPersonInputSchema>;

// Input schema for updating persons
export const updatePersonInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  birth_date: z.coerce.date().nullable().optional()
});

export type UpdatePersonInput = z.infer<typeof updatePersonInputSchema>;

// Relationship type enum
export const relationshipTypeSchema = z.enum(['parent', 'spouse', 'sibling']);
export type RelationshipType = z.infer<typeof relationshipTypeSchema>;

// Relationship schema
export const relationshipSchema = z.object({
  id: z.number(),
  person1_id: z.number(),
  person2_id: z.number(),
  relationship_type: relationshipTypeSchema,
  created_at: z.coerce.date()
});

export type Relationship = z.infer<typeof relationshipSchema>;

// Input schema for creating relationships
export const createRelationshipInputSchema = z.object({
  person1_id: z.number(),
  person2_id: z.number(),
  relationship_type: relationshipTypeSchema
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipInputSchema>;

// Input schema for deleting relationships
export const deleteRelationshipInputSchema = z.object({
  person1_id: z.number(),
  person2_id: z.number(),
  relationship_type: relationshipTypeSchema
});

export type DeleteRelationshipInput = z.infer<typeof deleteRelationshipInputSchema>;

// Family tree view schema (for displaying limited view)
export const familyTreeViewSchema = z.object({
  person_id: z.number()
});

export type FamilyTreeViewInput = z.infer<typeof familyTreeViewSchema>;

// Search persons schema
export const searchPersonsInputSchema = z.object({
  query: z.string().min(1, "Search query is required")
});

export type SearchPersonsInput = z.infer<typeof searchPersonsInputSchema>;

// Person with relationships (for family tree display)
export const personWithRelationshipsSchema = z.object({
  id: z.number(),
  name: z.string(),
  birth_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  parents: z.array(personSchema),
  children: z.array(personSchema),
  spouses: z.array(personSchema),
  siblings: z.array(personSchema)
});

export type PersonWithRelationships = z.infer<typeof personWithRelationshipsSchema>;

// Family tree data structure
export const familyTreeDataSchema = z.object({
  center_person: personWithRelationshipsSchema,
  grandparents: z.array(personWithRelationshipsSchema),
  grandchildren: z.array(personWithRelationshipsSchema)
});

export type FamilyTreeData = z.infer<typeof familyTreeDataSchema>;