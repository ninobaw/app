import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  maxTags,
  placeholder = 'Ajouter un tag...',
  className,
  ...props
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag) && (maxTags === undefined || tags.length < maxTags)) {
        onTagsChange([...tags, newTag]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      e.preventDefault();
      const newTags = [...tags];
      newTags.pop();
      onTagsChange(newTags);
    }
  }, [inputValue, tags, onTagsChange, maxTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onTagsChange]);

  return (
    <div className={cn("flex flex-wrap gap-2 border rounded-md p-2 min-h-[40px] items-center", className)}>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <button
            type="button"
            onClick={() => handleRemoveTag(tag)}
            className="ml-1 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
          >
            <X className="h-3 w-3 text-gray-600" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 border-none shadow-none focus-visible:ring-0"
        {...props}
      />
    </div>
  );
};