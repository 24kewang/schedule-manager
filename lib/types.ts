export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
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
  created_at: string;
  updated_at: string;
}