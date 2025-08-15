import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { personsTable, relationshipsTable } from '../db/schema';
import { type FamilyTreeViewInput } from '../schema';
import { getFamilyTree } from '../handlers/get_family_tree';

describe('getFamilyTree', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent person', async () => {
    const input: FamilyTreeViewInput = { person_id: 999 };
    const result = await getFamilyTree(input);
    expect(result).toBeNull();
  });

  it('should return basic person data with no relationships', async () => {
    // Create a person with no relationships
    const personResult = await db.insert(personsTable)
      .values({
        name: 'John Doe',
        birth_date: '1990-01-01'
      })
      .returning()
      .execute();

    const person = personResult[0];
    const input: FamilyTreeViewInput = { person_id: person.id };
    
    const result = await getFamilyTree(input);
    
    expect(result).not.toBeNull();
    expect(result!.center_person.id).toBe(person.id);
    expect(result!.center_person.name).toBe('John Doe');
    expect(result!.center_person.parents).toHaveLength(0);
    expect(result!.center_person.children).toHaveLength(0);
    expect(result!.center_person.spouses).toHaveLength(0);
    expect(result!.center_person.siblings).toHaveLength(0);
    expect(result!.grandparents).toHaveLength(0);
    expect(result!.grandchildren).toHaveLength(0);
  });

  it('should return family tree with direct relationships', async () => {
    // Create persons
    const personsData = await db.insert(personsTable)
      .values([
        { name: 'John Doe', birth_date: '1990-01-01' }, // Center person
        { name: 'Jane Smith', birth_date: '1992-05-15' }, // Spouse
        { name: 'Bob Doe', birth_date: '1965-03-10' }, // Father
        { name: 'Alice Doe', birth_date: '1967-07-20' }, // Mother
        { name: 'Tom Doe', birth_date: '1988-11-30' }, // Brother
        { name: 'Lisa Doe', birth_date: '2015-12-25' } // Child
      ])
      .returning()
      .execute();

    const [john, jane, bob, alice, tom, lisa] = personsData;

    // Create relationships
    await db.insert(relationshipsTable)
      .values([
        // John's spouse
        { person1_id: john.id, person2_id: jane.id, relationship_type: 'spouse' },
        // John's parents
        { person1_id: bob.id, person2_id: john.id, relationship_type: 'parent' },
        { person1_id: alice.id, person2_id: john.id, relationship_type: 'parent' },
        // John's sibling
        { person1_id: john.id, person2_id: tom.id, relationship_type: 'sibling' },
        // John's child
        { person1_id: john.id, person2_id: lisa.id, relationship_type: 'parent' }
      ])
      .execute();

    const input: FamilyTreeViewInput = { person_id: john.id };
    const result = await getFamilyTree(input);

    expect(result).not.toBeNull();
    expect(result!.center_person.id).toBe(john.id);
    expect(result!.center_person.name).toBe('John Doe');
    
    // Check relationships
    expect(result!.center_person.parents).toHaveLength(2);
    expect(result!.center_person.parents.map(p => p.name).sort()).toEqual(['Alice Doe', 'Bob Doe']);
    
    expect(result!.center_person.children).toHaveLength(1);
    expect(result!.center_person.children[0].name).toBe('Lisa Doe');
    
    expect(result!.center_person.spouses).toHaveLength(1);
    expect(result!.center_person.spouses[0].name).toBe('Jane Smith');
    
    expect(result!.center_person.siblings).toHaveLength(1);
    expect(result!.center_person.siblings[0].name).toBe('Tom Doe');
  });

  it('should return three-generation family tree with grandparents and grandchildren', async () => {
    // Create a complex family tree with 3 generations
    const personsData = await db.insert(personsTable)
      .values([
        // Grandparents generation
        { name: 'Grandfather Bob', birth_date: '1940-01-01' },
        { name: 'Grandmother Alice', birth_date: '1942-02-02' },
        // Parents generation
        { name: 'Father John', birth_date: '1970-03-03' },
        { name: 'Mother Jane', birth_date: '1972-04-04' },
        // Center person (child generation)
        { name: 'Center Person', birth_date: '1995-05-05' },
        { name: 'Sibling Tom', birth_date: '1997-06-06' },
        // Children generation
        { name: 'Child Lisa', birth_date: '2020-07-07' },
        { name: 'Child Mike', birth_date: '2022-08-08' },
        // Grandchildren generation
        { name: 'Grandchild Emma', birth_date: '2045-09-09' }
      ])
      .returning()
      .execute();

    const [grandpaBob, grandmaAlice, fatherJohn, motherJane, centerPerson, siblingTom, childLisa, childMike, grandchildEmma] = personsData;

    // Create relationships
    await db.insert(relationshipsTable)
      .values([
        // Grandparents to parents
        { person1_id: grandpaBob.id, person2_id: fatherJohn.id, relationship_type: 'parent' },
        { person1_id: grandmaAlice.id, person2_id: fatherJohn.id, relationship_type: 'parent' },
        // Parents to center person
        { person1_id: fatherJohn.id, person2_id: centerPerson.id, relationship_type: 'parent' },
        { person1_id: motherJane.id, person2_id: centerPerson.id, relationship_type: 'parent' },
        // Center person's sibling
        { person1_id: centerPerson.id, person2_id: siblingTom.id, relationship_type: 'sibling' },
        // Center person to children
        { person1_id: centerPerson.id, person2_id: childLisa.id, relationship_type: 'parent' },
        { person1_id: centerPerson.id, person2_id: childMike.id, relationship_type: 'parent' },
        // Children to grandchildren
        { person1_id: childLisa.id, person2_id: grandchildEmma.id, relationship_type: 'parent' }
      ])
      .execute();

    const input: FamilyTreeViewInput = { person_id: centerPerson.id };
    const result = await getFamilyTree(input);

    expect(result).not.toBeNull();
    
    // Check center person
    expect(result!.center_person.name).toBe('Center Person');
    expect(result!.center_person.parents).toHaveLength(2);
    expect(result!.center_person.children).toHaveLength(2);
    expect(result!.center_person.siblings).toHaveLength(1);

    // Check grandparents (should include parents of parents)
    expect(result!.grandparents).toHaveLength(2); // Father John and Mother Jane with their relationships
    const fatherWithRelationships = result!.grandparents.find(gp => gp.name === 'Father John');
    expect(fatherWithRelationships).toBeDefined();
    expect(fatherWithRelationships!.parents).toHaveLength(2); // Should have grandparents
    expect(fatherWithRelationships!.parents.map(p => p.name).sort()).toEqual(['Grandfather Bob', 'Grandmother Alice']);

    // Check grandchildren (should include children of children)
    expect(result!.grandchildren).toHaveLength(2); // Lisa and Mike with their relationships
    const lisaWithRelationships = result!.grandchildren.find(gc => gc.name === 'Child Lisa');
    expect(lisaWithRelationships).toBeDefined();
    expect(lisaWithRelationships!.children).toHaveLength(1); // Should have grandchild Emma
    expect(lisaWithRelationships!.children[0].name).toBe('Grandchild Emma');
  });

  it('should handle person with only parent relationships correctly', async () => {
    // Create persons
    const personsData = await db.insert(personsTable)
      .values([
        { name: 'Parent', birth_date: '1960-01-01' },
        { name: 'Child', birth_date: '1990-01-01' }
      ])
      .returning()
      .execute();

    const [parent, child] = personsData;

    // Create parent-child relationship
    await db.insert(relationshipsTable)
      .values([
        { person1_id: parent.id, person2_id: child.id, relationship_type: 'parent' }
      ])
      .execute();

    // Test from parent's perspective
    const parentInput: FamilyTreeViewInput = { person_id: parent.id };
    const parentResult = await getFamilyTree(parentInput);

    expect(parentResult!.center_person.children).toHaveLength(1);
    expect(parentResult!.center_person.children[0].name).toBe('Child');
    expect(parentResult!.center_person.parents).toHaveLength(0);

    // Test from child's perspective
    const childInput: FamilyTreeViewInput = { person_id: child.id };
    const childResult = await getFamilyTree(childInput);

    expect(childResult!.center_person.parents).toHaveLength(1);
    expect(childResult!.center_person.parents[0].name).toBe('Parent');
    expect(childResult!.center_person.children).toHaveLength(0);
  });

  it('should handle spouse relationships bidirectionally', async () => {
    // Create persons
    const personsData = await db.insert(personsTable)
      .values([
        { name: 'Husband', birth_date: '1980-01-01' },
        { name: 'Wife', birth_date: '1982-01-01' }
      ])
      .returning()
      .execute();

    const [husband, wife] = personsData;

    // Create spouse relationship
    await db.insert(relationshipsTable)
      .values([
        { person1_id: husband.id, person2_id: wife.id, relationship_type: 'spouse' }
      ])
      .execute();

    // Test from husband's perspective
    const husbandInput: FamilyTreeViewInput = { person_id: husband.id };
    const husbandResult = await getFamilyTree(husbandInput);

    expect(husbandResult!.center_person.spouses).toHaveLength(1);
    expect(husbandResult!.center_person.spouses[0].name).toBe('Wife');

    // Test from wife's perspective
    const wifeInput: FamilyTreeViewInput = { person_id: wife.id };
    const wifeResult = await getFamilyTree(wifeInput);

    expect(wifeResult!.center_person.spouses).toHaveLength(1);
    expect(wifeResult!.center_person.spouses[0].name).toBe('Husband');
  });
});