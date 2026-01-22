'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Course, Task } from '@/lib/types';
import CourseCard from '@/components/CourseCard';
import AddCourseButton from '@/components/AddCourseButton';
import UserMenu from '@/components/UserMenu';

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });

    setCourses(coursesData || []);
    setTasks(tasksData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTasksForCourse = (courseId: string) => {
    return tasks.filter((task) => task.course_id === courseId);
  };

  const handleDragStart = (courseId: string) => {
    setDraggedCourseId(courseId);
  };

  const handleDragEnd = () => {
    setDraggedCourseId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (!draggedCourseId) return;
    
    const draggedIndex = courses.findIndex((c) => c.id === draggedCourseId);
    
    // Only reorder if hovering over a different index
    if (draggedIndex === index || dragOverIndex === index) return;
    
    // Create new order based on hover position
    const newCourses = [...courses];
    const [draggedCourse] = newCourses.splice(draggedIndex, 1);
    newCourses.splice(index, 0, draggedCourse);
    
    setCourses(newCourses);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Course Manager</h1>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <AddCourseButton onCourseAdded={fetchData} />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">No courses yet. Add your first course to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div
                key={course.id}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                className="transition-all duration-200"
              >
                <CourseCard
                  course={course}
                  tasks={getTasksForCourse(course.id)}
                  onUpdate={fetchData}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedCourseId === course.id}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}