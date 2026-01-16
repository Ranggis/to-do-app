export interface Note {
  id: string;
  title?: string;
  text: string;
  isList: boolean;
  completed: boolean;
  completedAt?: string | null;
  imageUrl: string | null;
  color: string;
  isPinned: boolean;
  isArchived: boolean; 
  isDeleted: boolean; 
  userId: string;
  createdAt: string;
}