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
  const [currentPage, setCurrentPage] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
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

  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    fetchData();
  }, []);

  // Handle window resize to update courses per page
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTasksForCourse = (courseId: string) => {
    return tasks.filter((task) => task.course_id === courseId);
  };

  // Calculate courses per page based on screen size
  const getCoursesPerPage = () => {
    if (windowWidth >= 1024) return 3; // lg and up
    if (windowWidth >= 768) return 2; // md and up
    return 1; // sm and below
  };

  const coursesPerPage = getCoursesPerPage();
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  // Reset current page if it's out of bounds after resize
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [coursesPerPage, totalPages, currentPage]);

  const startIndex = currentPage * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const currentCourses = courses.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setFadeIn(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setFadeIn(false);
      }, 150);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setFadeIn(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setFadeIn(false);
      }, 150);
    }
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
          <div className="relative min-h-[600px]">
            {/* Previous button */}
            {currentPage > 0 && (
              <button
                onClick={handlePrevPage}
                className="fixed left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/60 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600/70 hover:bg-gray-50 hover:brightness-110 transition-all duration-200 text-xl font-bold"
                aria-label="Previous courses"
              >
                ‹
              </button>
            )}

            {/* Courses container */}
            <div className="flex justify-center items-center min-h-[600px]">
              <div className={`flex gap-6 transition-opacity duration-300 ${fadeIn ? 'opacity-0' : 'opacity-100'}`}>
                {currentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex-shrink-0 w-full max-w-sm"
                  >
                    <CourseCard
                      course={course}
                      tasks={getTasksForCourse(course.id)}
                      onUpdate={fetchData}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Next button */}
            {currentPage < totalPages - 1 && (
              <button
                onClick={handleNextPage}
                className="fixed right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/60 rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600/70 hover:bg-gray-50 hover:brightness-110 transition-all duration-200 text-xl font-bold"
                aria-label="Next courses"
              >
                ›
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
