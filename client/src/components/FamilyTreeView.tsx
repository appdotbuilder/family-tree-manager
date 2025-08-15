import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PersonCard } from './PersonCard';
import { Users, Crown, Baby, Heart, UserCheck } from 'lucide-react';
import type { FamilyTreeData, Person } from '../../../server/src/schema';

interface FamilyTreeViewProps {
  familyTreeData: FamilyTreeData;
  onPersonSelect: (person: Person) => void;
}

export function FamilyTreeView({ familyTreeData, onPersonSelect }: FamilyTreeViewProps) {
  const { center_person, grandparents, grandchildren } = familyTreeData;

  const RelationshipSection = ({ 
    title, 
    icon: Icon, 
    persons, 
    emptyMessage,
    color = "blue"
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    persons: Person[];
    emptyMessage: string;
    color?: string;
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className={`h-4 w-4 text-${color}-600`} />
          {title}
          <Badge variant="outline" className="ml-auto">
            {persons.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {persons.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {persons.map((person: Person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => onPersonSelect(person)}
                compact
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Center Person */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
          <UserCheck className="h-6 w-6 text-green-600" />
          Family Tree for {center_person.name}
        </h2>
        
        <Card className="max-w-md mx-auto border-2 border-green-200 bg-green-50">
          <CardContent className="p-6">
            <PersonCard
              person={center_person}
              isSelected
            />
          </CardContent>
        </Card>
      </div>

      {/* Grandparents Level */}
      {grandparents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Grandparents Generation
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grandparents.map((grandparent) => (
              <PersonCard
                key={grandparent.id}
                person={grandparent}
                onClick={() => onPersonSelect(grandparent)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Direct Relationships */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-600" />
          Direct Family
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RelationshipSection
            title="Parents"
            icon={Users}
            persons={center_person.parents}
            emptyMessage="No parents recorded"
            color="blue"
          />
          
          <RelationshipSection
            title="Spouses"
            icon={Heart}
            persons={center_person.spouses}
            emptyMessage="No spouses recorded"
            color="red"
          />
          
          <RelationshipSection
            title="Siblings"
            icon={Users}
            persons={center_person.siblings}
            emptyMessage="No siblings recorded"
            color="green"
          />
          
          <RelationshipSection
            title="Children"
            icon={Baby}
            persons={center_person.children}
            emptyMessage="No children recorded"
            color="orange"
          />
        </div>
      </div>

      {/* Grandchildren Level */}
      {grandchildren.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-600" />
            Grandchildren Generation
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grandchildren.map((grandchild) => (
              <PersonCard
                key={grandchild.id}
                person={grandchild}
                onClick={() => onPersonSelect(grandchild)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Family Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Family Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">{grandparents.length}</div>
              <div className="text-sm text-gray-600">Grandparents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {center_person.parents.length + center_person.spouses.length + center_person.siblings.length + center_person.children.length}
              </div>
              <div className="text-sm text-gray-600">Direct Relations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{grandchildren.length}</div>
              <div className="text-sm text-gray-600">Grandchildren</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {1 + grandparents.length + center_person.parents.length + center_person.spouses.length + 
                 center_person.siblings.length + center_person.children.length + grandchildren.length}
              </div>
              <div className="text-sm text-gray-600">Total Visible</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}