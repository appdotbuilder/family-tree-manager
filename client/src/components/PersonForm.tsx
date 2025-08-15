import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { CreatePersonInput } from '../../../server/src/schema';

interface PersonFormProps {
  onSubmit: (data: CreatePersonInput) => Promise<void>;
  isLoading?: boolean;
  onSuccess?: () => void;
}

export function PersonForm({ onSubmit, isLoading = false, onSuccess }: PersonFormProps) {
  const [formData, setFormData] = useState<CreatePersonInput>({
    name: '',
    birth_date: null
  });

  const [birthDateString, setBirthDateString] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert birth date string to Date or null
    const birthDate = birthDateString 
      ? new Date(birthDateString) 
      : null;

    const submitData: CreatePersonInput = {
      name: formData.name,
      birth_date: birthDate
    };

    try {
      await onSubmit(submitData);
      // Reset form after successful submission
      setFormData({
        name: '',
        birth_date: null
      });
      setBirthDateString('');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Full Name *
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePersonInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter full name..."
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate" className="text-sm font-medium">
          Birth Date
        </Label>
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="birthDate"
            type="date"
            value={birthDateString}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBirthDateString(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <p className="text-xs text-gray-500">Optional - leave empty if unknown</p>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || !formData.name.trim()}
        className="w-full flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        {isLoading ? 'Adding Family Member...' : 'Add Family Member'}
      </Button>
    </form>
  );
}