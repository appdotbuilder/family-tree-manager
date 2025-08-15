import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PersonCard } from './PersonCard';
import { Heart, Plus, Trash2, Users, Crown, Baby, UserX } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Person, RelationshipType, CreateRelationshipInput, PersonWithRelationships } from '../../../server/src/schema';

interface RelationshipManagerProps {
  selectedPerson: Person;
  allPersons: Person[];
  onRelationshipUpdate: () => void;
}

export function RelationshipManager({ selectedPerson, allPersons, onRelationshipUpdate }: RelationshipManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTargetPerson, setSelectedTargetPerson] = useState<number | null>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<RelationshipType | null>(null);
  const [personRelationships, setPersonRelationships] = useState<PersonWithRelationships | null>(null);

  // Load relationships for the selected person
  const loadPersonRelationships = useCallback(async () => {
    try {
      const relationships = await trpc.getPersonRelationships.query({ personId: selectedPerson.id });
      // Handle stub response - if null, create empty relationships structure
      if (!relationships) {
        setPersonRelationships({
          id: selectedPerson.id,
          name: selectedPerson.name,
          birth_date: selectedPerson.birth_date,
          created_at: selectedPerson.created_at,
          updated_at: selectedPerson.updated_at,
          parents: [],
          children: [],
          spouses: [],
          siblings: []
        });
      } else {
        setPersonRelationships(relationships);
      }
    } catch (error) {
      console.error('Failed to load person relationships:', error);
      // Create empty structure on error
      setPersonRelationships({
        id: selectedPerson.id,
        name: selectedPerson.name,
        birth_date: selectedPerson.birth_date,
        created_at: selectedPerson.created_at,
        updated_at: selectedPerson.updated_at,
        parents: [],
        children: [],
        spouses: [],
        siblings: []
      });
    }
  }, [selectedPerson]);

  useEffect(() => {
    loadPersonRelationships();
  }, [loadPersonRelationships]);

  // Get available persons for relationship creation (excluding selected person)
  const availablePersons = allPersons.filter(p => p.id !== selectedPerson.id);

  // Handle relationship creation
  const handleCreateRelationship = async () => {
    if (!selectedTargetPerson || !selectedRelationshipType) return;

    setIsLoading(true);
    try {
      const relationshipData: CreateRelationshipInput = {
        person1_id: selectedPerson.id,
        person2_id: selectedTargetPerson,
        relationship_type: selectedRelationshipType
      };

      await trpc.createRelationship.mutate(relationshipData);
      
      // Reset form
      setSelectedTargetPerson(null);
      setSelectedRelationshipType(null);
      
      // Refresh data
      onRelationshipUpdate();
      loadPersonRelationships();
    } catch (error) {
      console.error('Failed to create relationship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle relationship deletion
  const handleDeleteRelationship = async (targetPersonId: number, relationshipType: RelationshipType) => {
    setIsLoading(true);
    try {
      await trpc.deleteRelationship.mutate({
        person1_id: selectedPerson.id,
        person2_id: targetPersonId,
        relationship_type: relationshipType
      });
      
      // Refresh data
      onRelationshipUpdate();
      loadPersonRelationships();
    } catch (error) {
      console.error('Failed to delete relationship:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case 'parent':
        return <Crown className="h-4 w-4" />;
      case 'spouse':
        return <Heart className="h-4 w-4" />;
      case 'sibling':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRelationshipColor = (type: RelationshipType) => {
    switch (type) {
      case 'parent':
        return 'blue';
      case 'spouse':
        return 'red';
      case 'sibling':
        return 'green';
      default:
        return 'gray';
    }
  };

  const RelationshipSection = ({ 
    title, 
    relationshipType, 
    persons 
  }: {
    title: string;
    relationshipType: RelationshipType;
    persons: Person[];
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getRelationshipIcon(relationshipType)}
            <span>{title}</span>
            <Badge variant="outline">{persons.length}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {persons.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">
            No {title.toLowerCase()} recorded
          </p>
        ) : (
          persons.map((person: Person) => (
            <div key={person.id} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <PersonCard person={person} compact />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteRelationship(person.id, relationshipType)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Manage Relationships for {selectedPerson.name}
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            Add new family relationships or remove existing ones
          </p>
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
            <span>💡 Note: Relationship management is currently using stub data</span>
          </div>
        </CardContent>
      </Card>

      {/* Add New Relationship */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Relationship
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availablePersons.length === 0 ? (
            <div className="text-center py-6">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No other family members available</p>
              <p className="text-sm text-gray-400">Add more family members to create relationships</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Family Member
                  </label>
                  <Select 
                    value={selectedTargetPerson?.toString() || ''} 
                    onValueChange={(value) => setSelectedTargetPerson(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a person..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePersons.map((person: Person) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship Type
                  </label>
                  <Select 
                    value={selectedRelationshipType || ''} 
                    onValueChange={(value: RelationshipType) => setSelectedRelationshipType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose relationship..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Parent
                        </div>
                      </SelectItem>
                      <SelectItem value="spouse">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Spouse
                        </div>
                      </SelectItem>
                      <SelectItem value="sibling">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Sibling
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateRelationship}
                disabled={!selectedTargetPerson || !selectedRelationshipType || isLoading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? 'Adding Relationship...' : 'Add Relationship'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Existing Relationships */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Current Relationships</h3>
        
        {personRelationships ? (
          <div className="grid gap-6 md:grid-cols-2">
            <RelationshipSection
              title="Parents"
              relationshipType="parent"
              persons={personRelationships.parents}
            />
            
            <RelationshipSection
              title="Spouses"
              relationshipType="spouse"
              persons={personRelationships.spouses}
            />
            
            <RelationshipSection
              title="Siblings"
              relationshipType="sibling"
              persons={personRelationships.siblings}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    <span>Children</span>
                    <Badge variant="outline">{personRelationships.children.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {personRelationships.children.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    No children recorded
                  </p>
                ) : (
                  personRelationships.children.map((child: Person) => (
                    <div key={child.id} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <PersonCard person={child} compact />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRelationship(child.id, 'parent')}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}