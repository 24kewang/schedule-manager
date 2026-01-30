export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  display_order: number | null;  // NEW: User-defined sort order
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  course_id: string;
  task_type: 'assignment' | 'assessment';
  name: string;
  description: string | null;
  start_date: string | null;
  start_time: string | null;
  due_date: string | null;
  due_time: string | null;
  is_completed: boolean;
  is_starred: boolean;  // NEW: Priority/starred status
  created_at: string;
  updated_at: string;
}