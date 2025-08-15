import { serial, text, pgTable, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define relationship type enum
export const relationshipTypeEnum = pgEnum('relationship_type', ['parent', 'spouse', 'sibling']);

// Persons table
export const personsTable = pgTable('persons', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  birth_date: date('birth_date'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relationships table
export const relationshipsTable = pgTable('relationships', {
  id: serial('id').primaryKey(),
  person1_id: serial('person1_id').notNull().references(() => personsTable.id, { onDelete: 'cascade' }),
  person2_id: serial('person2_id').notNull().references(() => personsTable.id, { onDelete: 'cascade' }),
  relationship_type: relationshipTypeEnum('relationship_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations for better query capabilities
export const personsRelations = relations(personsTable, ({ many }) => ({
  relationships1: many(relationshipsTable, { relationName: 'person1' }),
  relationships2: many(relationshipsTable, { relationName: 'person2' })
}));

export const relationshipsRelations = relations(relationshipsTable, ({ one }) => ({
  person1: one(personsTable, {
    fields: [relationshipsTable.person1_id],
    references: [personsTable.id],
    relationName: 'person1'
  }),
  person2: one(personsTable, {
    fields: [relationshipsTable.person2_id],
    references: [personsTable.id],
    relationName: 'person2'
  })
}));

// TypeScript types for the table schemas
export type Person = typeof personsTable.$inferSelect;
export type NewPerson = typeof personsTable.$inferInsert;
export type Relationship = typeof relationshipsTable.$inferSelect;
export type NewRelationship = typeof relationshipsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  persons: personsTable, 
  relationships: relationshipsTable 
};

export const tableRelations = {
  personsRelations,
  relationshipsRelations
};