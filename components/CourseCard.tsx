'use client';

import { Course, Task } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import AddTaskButton from './AddTaskButton';
import { useState } from 'react';

interface CourseCardProps {
  course: Course;
  tasks: Task[];
  onUpdate: () => void;
}

export default function CourseCard({ course, tasks, onUpdate }: CourseCardProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const assignments = tasks.filter((t) => t.task_type === 'assignment');
  const assessments = tasks.filter((t) => t.task_type === 'assessment');

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);
    onUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    onUpdate();
  };

  const handleDeleteCourse = async () => {
    if (confirm('Are you sure you want to delete this course and all its tasks?')) {
      setIsDeleting(true);
      await supabase.from('courses').delete().eq('id', course.id);
      onUpdate();
    }
  };

  const formatDate = (date: string | null, time: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString();
    return time ? `${dateStr} ${time}` : dateStr;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          {course.description && (
            <p className="text-sm text-gray-600 mt-1">{course.description}</p>
          )}
        </div>
        <button
          onClick={handleDeleteCourse}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 text-sm ml-2"
          title="Delete course"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        {/* Assignments Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Assignments</h4>
            <AddTaskButton courseId={course.id} onTaskAdded={onUpdate} />
          </div>
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assignments yet</p>
            ) : (
              assignments.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 rounded p-2 text-sm border border-gray-200"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleComplete(task.id, task.is_completed)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium ${
                          task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {task.name}
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {task.start_date && (
                          <span>Start: {formatDate(task.start_date, task.start_time)} | </span>
                        )}
                        Due: {formatDate(task.due_date, task.due_time)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assessments Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Assessments</h4>
          <div className="space-y-2">
            {assessments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assessments yet</p>
            ) : (
              assessments.map((task) => (
                <div
                  key={task.id}
                  className="bg-blue-50 rounded p-2 text-sm border border-blue-200"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{task.name}</div>
                      {task.description && (
                        <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(task.due_date, task.due_time)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}