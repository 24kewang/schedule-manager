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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const supabase = createClient();

  const fetchData = async () => {
    // setLoading(true);

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: false })
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
    setDraggedIndex(courses.findIndex((c) => c.id === courseId));
  };

  const handleDragEnd = async () => {
    if (!draggedCourseId) {
      setDraggedCourseId(null);
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPosition = dragOverIndex !== null ? dragOverIndex : draggedIndex;
    // If position didn't change, nothing to do
    if (newPosition == null || draggedIndex === newPosition) {
      setDraggedCourseId(null);
      setDragOverIndex(null);
      return;
    }

    const prevCourse = courses[newPosition - 1];
    const nextCourse = courses[newPosition + 1];

    let newOrder: number;
    let needsFullReorder = false;

    if (!prevCourse) {
      // Moving to first position
      if (nextCourse?.display_order == undefined) {
        // If next course has no order, we need full reorder
        needsFullReorder = true;
      }
      else {
        const nextOrder = nextCourse.display_order;
        newOrder = Math.floor(nextOrder / 2);
        
        // Check if gap is closing
        if (newOrder <= 2) {
          needsFullReorder = true;
        }
      }
    } else if (!nextCourse) {
      if (prevCourse.display_order == undefined) {
        // If previous course has no order, we need full reorder
        needsFullReorder = true;
      }
      else {
        // Moving to last position
        const prevOrder = prevCourse.display_order;
        newOrder = prevOrder + 1000;
        if (newOrder >= courses.length * 2000) {
          needsFullReorder = true;
        }
      }
    } else {
      // Moving between two items
      if (prevCourse?.display_order == undefined || nextCourse?.display_order == undefined) {
        // If either course has no order, we need full reorder
        needsFullReorder = true;
      }
      else {
        const prevOrder = prevCourse.display_order;
        const nextOrder = nextCourse.display_order;
        const gap = nextOrder - prevOrder;
        
        // If gap is too small, trigger full reorder
        if (gap < 3) {
          needsFullReorder = true;
        } else {
          newOrder = Math.floor((prevOrder + nextOrder) / 2);
        }
      }
    }

    if (needsFullReorder) {
      // Full reorder: update all courses with clean gaps
      await reorderAllCourses(courses);
    } else {
      // Single update: only update the dragged course
      await supabase
        .from('courses')
        .update({ display_order: newOrder! })
        .eq('id', draggedCourseId);
    }

    setDraggedCourseId(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    
    // Refresh to get updated order from database
    await fetchData();
  };

  const reorderAllCourses = async (
    currentCourses: Course[]
  ) => {
    const updates = currentCourses.map((course, index) => ({
      id: course.id,
      display_order: (index + 1) * 1000,
    }));

    // Parallel updates for better performance
    await Promise.all(
      updates.map((update) =>
        supabase
          .from('courses')
          .update({ display_order: update.display_order })
          .eq('id', update.id)
      )
    );
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (!draggedCourseId) return;
    
    // local index of the dragged course (from preview), not original dragged index
    const currentDraggedIndex = courses.findIndex((c) => c.id === draggedCourseId);
    
    // Update drag over index for visual feedback
    setDragOverIndex(index);
    
    // Only reorder visually if hovering over a different index
    if (currentDraggedIndex === index) return;
    
    // Create new order based on hover position for immediate visual feedback
    const newCourses = [...courses];
    const [draggedCourse] = newCourses.splice(currentDraggedIndex, 1);
    newCourses.splice(index, 0, draggedCourse);
    
    setCourses(newCourses);
  };

  const handleDragLeave = () => {
    // Don't clear dragOverIndex on every leave to prevent flickering
    // It will be cleared on dragEnd
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
