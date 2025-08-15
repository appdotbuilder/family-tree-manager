import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, MousePointer } from 'lucide-react';
import type { Person } from '../../../server/src/schema';

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function PersonCard({ person, onClick, isSelected = false, compact = false }: PersonCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const age = calculateAge(person.birth_date);

  const cardClasses = [
    "transition-all duration-200 hover:shadow-md",
    onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
    isSelected && "ring-2 ring-blue-500 shadow-lg",
    compact ? "p-2" : "p-0"
  ].filter(Boolean).join(" ");

  const contentClasses = compact ? "p-3 space-y-3" : "p-4 space-y-3";
  const nameClasses = compact ? "text-sm font-semibold text-gray-900" : "text-base font-semibold text-gray-900";

  return (
    <Card 
      className={cardClasses}
      onClick={onClick}
    >
      <CardContent className={contentClasses}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className={nameClasses}>
                {person.name}
              </h3>
              {!compact && (
                <p className="text-xs text-gray-500">ID: {person.id}</p>
              )}
            </div>
          </div>
          
          {onClick && !compact && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MousePointer className="h-3 w-3" />
              <span>Click to view</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>Born: {formatDate(person.birth_date)}</span>
          </div>
          
          {age !== null && (
            <Badge variant="outline" className="text-xs">
              {age} years old
            </Badge>
          )}
        </div>

        {!compact && (
          <div className="text-xs text-gray-400 pt-2 border-t">
            <div>Added: {person.created_at.toLocaleDateString()}</div>
            {person.updated_at.getTime() !== person.created_at.getTime() && (
              <div>Updated: {person.updated_at.toLocaleDateString()}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}