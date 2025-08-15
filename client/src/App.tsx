import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Plus, TreePine, Heart } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { PersonForm } from '@/components/PersonForm';
import { PersonCard } from '@/components/PersonCard';
import { FamilyTreeView } from '@/components/FamilyTreeView';
import { RelationshipManager } from '@/components/RelationshipManager';
// Using type-only imports for better TypeScript compliance
import type { Person, CreatePersonInput, FamilyTreeData } from '../../server/src/schema';

function App() {
  // State management with proper typing
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [familyTreeData, setFamilyTreeData] = useState<FamilyTreeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('people');

  // Load all persons on mount
  const loadPersons = useCallback(async () => {
    try {
      const result = await trpc.getPersons.query();
      setPersons(result);
    } catch (error) {
      console.error('Failed to load persons:', error);
    }
  }, []);

  // Load family tree for selected person
  const loadFamilyTree = useCallback(async (personId: number) => {
    try {
      const result = await trpc.getFamilyTree.query({ person_id: personId });
      // Handle stub response - the backend returns a placeholder structure
      if (result) {
        setFamilyTreeData(result);
      } else {
        // Create empty structure if null
        const person = persons.find(p => p.id === personId);
        if (person) {
          setFamilyTreeData({
            center_person: {
              ...person,
              parents: [],
              children: [],
              spouses: [],
              siblings: []
            },
            grandparents: [],
            grandchildren: []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load family tree:', error);
      setFamilyTreeData(null);
    }
  }, [persons]);

  // Search persons
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await trpc.searchPersons.query({ query });
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search persons:', error);
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  // Handle search input changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, handleSearch]);

  // Handle person creation
  const handlePersonCreate = async (personData: CreatePersonInput) => {
    setIsLoading(true);
    try {
      const newPerson = await trpc.createPerson.mutate(personData);
      setPersons((prev: Person[]) => [...prev, newPerson]);
    } catch (error) {
      console.error('Failed to create person:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle person selection
  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    loadFamilyTree(person.id);
    setActiveTab('tree');
  };

  // Handle relationship updates
  const handleRelationshipUpdate = () => {
    // Refresh persons list and family tree
    loadPersons();
    if (selectedPerson) {
      loadFamilyTree(selectedPerson.id);
    }
  };

  const displayPersons = searchQuery.trim() ? searchResults : persons;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TreePine className="h-8 w-8 text-green-600" />
            <h1 className="text-4xl font-bold text-gray-800">Family Tree</h1>
            <Heart className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            Build and explore your family connections. Add family members, create relationships, and discover your heritage through an interactive family tree.
          </p>
          {/* Stub notification */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
            <span>⚠️ Demo Mode: Backend APIs are currently stubbed for demonstration</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto mb-8">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add
            </TabsTrigger>
            <TabsTrigger value="tree" disabled={!selectedPerson}>
              <TreePine className="h-4 w-4" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="relationships" disabled={!selectedPerson}>
              <Heart className="h-4 w-4" />
              Relations
            </TabsTrigger>
          </TabsList>

          {/* People Management Tab */}
          <TabsContent value="people" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search family members..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* People List */}
                {displayPersons.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {searchQuery.trim() ? 'No family members found' : 'No family members yet'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {searchQuery.trim() 
                        ? 'Try adjusting your search terms' 
                        : 'Start building your family tree by adding your first family member!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayPersons.map((person: Person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onClick={() => handlePersonSelect(person)}
                        isSelected={selectedPerson?.id === person.id}
                      />
                    ))}
                  </div>
                )}

                {/* Search Results Info */}
                {searchQuery.trim() && searchResults.length > 0 && (
                  <div className="mt-4 text-center">
                    <Badge variant="secondary">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Person Tab */}
          <TabsContent value="add">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Family Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PersonForm
                  onSubmit={handlePersonCreate}
                  isLoading={isLoading}
                  onSuccess={() => setActiveTab('people')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tree Tab */}
          <TabsContent value="tree">
            {selectedPerson && familyTreeData ? (
              <FamilyTreeView
                familyTreeData={familyTreeData}
                onPersonSelect={handlePersonSelect}
              />
            ) : selectedPerson ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Loading family tree...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <TreePine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Select a family member to view their tree</p>
                  <p className="text-sm text-gray-400">Go to the People tab and click on someone to explore their family connections</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships">
            {selectedPerson ? (
              <RelationshipManager
                selectedPerson={selectedPerson}
                allPersons={persons}
                onRelationshipUpdate={handleRelationshipUpdate}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Select a family member to manage relationships</p>
                  <p className="text-sm text-gray-400">Go to the People tab and click on someone to add or manage their family connections</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;