export interface Post {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  userId?: number | null;
  authorEmail?: string | null;
}