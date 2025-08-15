import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPersonInputSchema, 
  updatePersonInputSchema,
  createRelationshipInputSchema,
  deleteRelationshipInputSchema,
  familyTreeViewSchema,
  searchPersonsInputSchema
} from './schema';

// Import handlers
import { createPerson } from './handlers/create_person';
import { updatePerson } from './handlers/update_person';
import { getPersons } from './handlers/get_persons';
import { getPersonById } from './handlers/get_person_by_id';
import { searchPersons } from './handlers/search_persons';
import { createRelationship } from './handlers/create_relationship';
import { deleteRelationship } from './handlers/delete_relationship';
import { getFamilyTree } from './handlers/get_family_tree';
import { getPersonRelationships } from './handlers/get_person_relationships';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Person management
  createPerson: publicProcedure
    .input(createPersonInputSchema)
    .mutation(({ input }) => createPerson(input)),

  updatePerson: publicProcedure
    .input(updatePersonInputSchema)
    .mutation(({ input }) => updatePerson(input)),

  getPersons: publicProcedure
    .query(() => getPersons()),

  getPersonById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPersonById(input.id)),

  searchPersons: publicProcedure
    .input(searchPersonsInputSchema)
    .query(({ input }) => searchPersons(input)),

  // Relationship management
  createRelationship: publicProcedure
    .input(createRelationshipInputSchema)
    .mutation(({ input }) => createRelationship(input)),

  deleteRelationship: publicProcedure
    .input(deleteRelationshipInputSchema)
    .mutation(({ input }) => deleteRelationship(input)),

  // Family tree views
  getFamilyTree: publicProcedure
    .input(familyTreeViewSchema)
    .query(({ input }) => getFamilyTree(input)),

  getPersonRelationships: publicProcedure
    .input(z.object({ personId: z.number() }))
    .query(({ input }) => getPersonRelationships(input.personId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Family Tree TRPC server listening at port: ${port}`);
}

start();