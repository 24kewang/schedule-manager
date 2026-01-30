'use client';

import { Course, Task } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import AddTaskButton from './AddTaskButton';
import EditCourseButton from './EditCourseButton';
import EditTaskButton from './EditTaskButton';
import { useState } from 'react';

interface CourseCardProps {
  course: Course;
  tasks: Task[];
  onUpdate: () => void;
  onDragStart?: (courseId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

type AssignmentStatus = 'red' | 'yellow' | 'blue' | 'green';
type AssessmentStatus = 'red' | 'blue' | 'green';

export default function CourseCard({ course, tasks, onUpdate, onDragStart, onDragEnd, isDragging }: CourseCardProps) {
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentFilters, setAssignmentFilters] = useState<Set<AssignmentStatus>>(
    new Set(['red', 'yellow', 'blue', 'green'])
  );
  const [assessmentFilters, setAssessmentFilters] = useState<Set<AssessmentStatus>>(
    new Set(['red', 'blue', 'green'])
  );
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const assignments = tasks.filter((t) => t.task_type === 'assignment');
  const assessments = tasks.filter((t) => t.task_type === 'assessment');

  // Parse date string (YYYY-MM-DD) and time string (HH:MM or HH:MM:SS) as local time
  const parseLocalDateTime = (dateStr: string | null, timeStr: string | null): Date | null => {
    if (!dateStr) return null;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    let hour = 0;
    let minute = 0;
    let second = 0;
    
    if (timeStr) {
      const timeParts = timeStr.split(':').map(Number);
      hour = timeParts[0] || 0;
      minute = timeParts[1] || 0;
      second = timeParts[2] || 0;
    }
    
    return new Date(year, month - 1, day, hour, minute, second);
  };

  const getAssignmentStatus = (task: Task): AssignmentStatus => {
    if (task.is_completed) return 'green';

    const now = new Date();
    const dueDate = parseLocalDateTime(task.due_date, task.due_time || '0:00');

    if (dueDate && dueDate < now) return 'red';

    if (task.start_date) {
      const startDate = parseLocalDateTime(task.start_date, task.start_time || '00:00');
      if (startDate && now < startDate) return 'blue';
      return 'yellow';
    }

    return dueDate && dueDate >= now ? 'yellow' : 'blue';
  };

  const getAssessmentStatus = (task: Task): AssessmentStatus => {
    const now = new Date();
    const dueDate = parseLocalDateTime(task.due_date, task.due_time || '00:00');

    if (!dueDate) return 'blue';

    if (dueDate < now) return 'green';

    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 7 ? 'red' : 'blue';
  };

  const getDaysUntilDue = (task: Task): string | null => {
    const now = new Date();
    const dueDate = parseLocalDateTime(task.due_date, task.due_time || '00:00');

    if (!dueDate) return null;

    const diffMs = dueDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMinutes >= 0) {
      // Future deadline
      if (diffMinutes < 60) {
        const minutes = Math.floor(diffMinutes);
        if (minutes === 0) return 'Due now';
        return `Due in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        const hours = Math.floor(diffHours);
        const remainingMinutes = Math.floor(diffMinutes - (hours * 60));
        if (remainingMinutes === 0) {
          return `Due in ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `Due in ${hours}h ${remainingMinutes}m`;
      } else {
        const days = Math.floor(diffDays);
        return `Due in ${days} day${days !== 1 ? 's' : ''}`;
      }
    } else {
      // Past deadline (overdue) - only show for assignments, not assessments
      if (task.task_type === 'assessment') return null;
      
      const absDiffMinutes = Math.abs(diffMinutes);
      const absDiffHours = Math.abs(diffHours);
      const absDiffDays = Math.abs(diffDays);
      
      if (absDiffMinutes < 60) {
        const minutes = Math.floor(absDiffMinutes);
        return `Due ${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      } else if (absDiffHours < 24) {
        const hours = Math.floor(absDiffHours);
        const remainingMinutes = Math.floor(absDiffMinutes - (hours * 60));
        if (remainingMinutes === 0) {
          return `Due ${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        return `Due ${hours}h ${remainingMinutes}m ago`;
      } else {
        const days = Math.floor(absDiffDays);
        return `Due ${days} day${days !== 1 ? 's' : ''} ago`;
      }
    }
  };

  const getDueLabelColor = (task: Task): string => {
    const now = new Date();
    const dueDate = parseLocalDateTime(task.due_date, task.due_time || '00:00');

    if (!dueDate) return '';

    const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'bg-red-200 text-red-800'; // Overdue
    if (diffDays <= 3) return 'bg-red-200 text-red-800';
    if (diffDays <= 7) return 'bg-yellow-200 text-yellow-800';
    return 'bg-gray-200 text-gray-800';
  };

  const getBackgroundClass = (status: AssignmentStatus | AssessmentStatus): string => {
    const baseClasses = 'rounded p-2 text-sm border';
    const statusClasses: Record<string, string> = {
      red: 'bg-red-50 border-red-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
    };
    return `${baseClasses} ${statusClasses[status]}`;
  };

  const sortTasksByDueDate = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      const dateA = parseLocalDateTime(a.due_date, a.due_time || '00:00');
      const dateB = parseLocalDateTime(b.due_date, b.due_time || '00:00');
      const timeA = dateA?.getTime() ?? 0;
      const timeB = dateB?.getTime() ?? 0;
      return timeA - timeB;
    });
  };

  const sortAssignmentsByStatus = (tasks: Task[]): Task[] => {
    const statusOrder: Record<AssignmentStatus, number> = { red: 0, yellow: 1, blue: 2, green: 3 };
    return sortTasksByDueDate(tasks).sort((a, b) => {
      // First sort by completion status (incomplete first)
      if (a.is_completed && !b.is_completed) return 1;
      if (!a.is_completed && b.is_completed) return -1;
      
      // Then by starred status
      if (a.is_starred && !b.is_starred) return -1;
      if (!a.is_starred && b.is_starred) return 1;
      
      // Finally by status (due date priority)
      return statusOrder[getAssignmentStatus(a)] - statusOrder[getAssignmentStatus(b)];
    });
  };

  const sortAssessmentsByStatus = (tasks: Task[]): Task[] => {
    const statusOrder: Record<AssessmentStatus, number> = { red: 0, blue: 1, green: 2 };
    return sortTasksByDueDate(tasks).sort((a, b) => {
      // Starred tasks come first
      if (a.is_starred && !b.is_starred) return -1;
      if (!a.is_starred && b.is_starred) return 1;
      
      // Within starred/unstarred groups, sort by status
      return statusOrder[getAssessmentStatus(a)] - statusOrder[getAssessmentStatus(b)];
    });
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    await supabase
      .from('tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);
    onUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setDeletingTaskId(taskId);
      await supabase.from('tasks').delete().eq('id', taskId);
      setDeletingTaskId(null);
      onUpdate();
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    const { error } = await supabase.from('tasks').insert({
      course_id: task.course_id,
      task_type: task.task_type,
      name: task.name,
      description: task.description,
      start_date: task.start_date,
      start_time: task.start_time,
      due_date: task.due_date,
      due_time: task.due_time,
      is_completed: false,
    });

    if (!error) {
      onUpdate();
    }
  };

  const handleToggleStar = async (taskId: string, currentStarred: boolean) => {
    const { error } = await supabase
      .from('tasks')
      .update({ is_starred: !currentStarred })
      .eq('id', taskId);

    if (!error) {
      onUpdate();
    }
  };

  const handleDeleteCourse = async () => {
    if (confirm('Are you sure you want to delete this course and all its tasks?')) {
      setIsDeleting(true);
      await supabase.from('courses').delete().eq('id', course.id);
      onUpdate();
    }
  };

  const toggleAssignmentFilter = (status: AssignmentStatus) => {
    const newFilters = new Set(assignmentFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setAssignmentFilters(newFilters);
  };

  const toggleAssessmentFilter = (status: AssessmentStatus) => {
    const newFilters = new Set(assessmentFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setAssessmentFilters(newFilters);
  };

  const formatDate = (date: string | null, time: string | null) => {
    const dateTime = parseLocalDateTime(date, time);
    if (!dateTime) return '';
    
    // Get day of week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = daysOfWeek[dateTime.getDay()];
    
    const dateStr = dateTime.toLocaleDateString();
    const dateWithDay = `${dayOfWeek} ${dateStr}`;
    
    if (!time) return dateWithDay;
    
    // Format time as AM/PM
    let hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    return `${dateWithDay} ${timeStr}`;
  };

  const filteredAssignments = sortAssignmentsByStatus(assignments).filter((task) =>
    assignmentFilters.has(getAssignmentStatus(task)) &&
    (!showStarredOnly || task.is_starred)
  );

  const filteredAssessments = sortAssessmentsByStatus(assessments).filter((task) =>
    assessmentFilters.has(getAssessmentStatus(task)) &&
    (!showStarredOnly || task.is_starred)
  );

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95 shadow-lg' : 'hover:shadow-lg'
      }`}
      draggable
      onDragStart={() => onDragStart?.(course.id)}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className="flex flex-col items-center gap-2 mb-3">
        <div className="text-gray-400 text-sm cursor-grab active:cursor-grabbing">⋮⋮⋮</div>
      </div>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          {course.description && (
            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{course.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-3 ml-2 items-center">
          <button
            onClick={handleDeleteCourse}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 text-sm"
            title="Delete course"
          >
            ×
          </button>
          <EditCourseButton course={course} onCourseUpdated={onUpdate} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Assignments Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Assignments</h4>
            <AddTaskButton courseId={course.id} onTaskAdded={onUpdate} />
          </div>

          {/* Assignment Filters */}
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => toggleAssignmentFilter('red')}
              className={`text-xs px-2 py-1 rounded ${
                assignmentFilters.has('red')
                  ? 'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => toggleAssignmentFilter('yellow')}
              className={`text-xs px-2 py-1 rounded ${
                assignmentFilters.has('yellow')
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => toggleAssignmentFilter('blue')}
              className={`text-xs px-2 py-1 rounded ${
                assignmentFilters.has('blue')
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => toggleAssignmentFilter('green')}
              className={`text-xs px-2 py-1 rounded ${
                assignmentFilters.has('green')
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`text-xs px-2 py-1 rounded ${
                showStarredOnly
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              ⭐ Starred
            </button>
          </div>

          <div className="space-y-2">
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assignments yet</p>
            ) : filteredAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assignments in selected categories</p>
            ) : (
              filteredAssignments.map((task) => {
                const status = getAssignmentStatus(task);
                const dueLabel = getDaysUntilDue(task);
                const labelColor = getDueLabelColor(task);

                return (
                  <div key={task.id} className={`${getBackgroundClass(status)} ${task.is_starred ? 'border-2 border-orange-300' : ''} relative`}>
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
                            task.is_completed
                              ? 'line-through text-gray-400'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{task.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {task.start_date && (
                            <span>Start: {formatDate(task.start_date, task.start_time)} | </span>
                          )}
                          Due: {formatDate(task.due_date, task.due_time)}
                        </div>
                        {dueLabel && (
                          <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${labelColor}`}>
                            {dueLabel}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Delete task"
                        >
                          ×
                        </button>
                        <EditTaskButton task={task} onTaskUpdated={onUpdate} />
                        <button
                          onClick={() => handleDuplicateTask(task)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          title="Duplicate task"
                        >
                          ⎘
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStar(task.id, task.is_starred)}
                      className="absolute bottom-2 left-2 text-lg hover:scale-110 transition-transform"
                      title={task.is_starred ? 'Unstar task' : 'Star task'}
                    >
                      {task.is_starred ? '★' : '☆'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assessments Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Assessments</h4>
          </div>

          {/* Assessment Filters */}
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              onClick={() => toggleAssessmentFilter('red')}
              className={`text-xs px-2 py-1 rounded ${
                assessmentFilters.has('red')
                  ? 'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Soon
            </button>
            <button
              onClick={() => toggleAssessmentFilter('blue')}
              className={`text-xs px-2 py-1 rounded ${
                assessmentFilters.has('blue')
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => toggleAssessmentFilter('green')}
              className={`text-xs px-2 py-1 rounded ${
                assessmentFilters.has('green')
                  ? 'bg-green-200 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`text-xs px-2 py-1 rounded ${
                showStarredOnly
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              ⭐ Starred
            </button>
          </div>

          <div className="space-y-2">
            {assessments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assessments yet</p>
            ) : filteredAssessments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No assessments in selected categories</p>
            ) : (
              filteredAssessments.map((task) => {
                const status = getAssessmentStatus(task);
                const dueLabel = getDaysUntilDue(task);
                const labelColor = getDueLabelColor(task);

                return (
                  <div key={task.id} className={`${getBackgroundClass(status)} ${task.is_starred ? 'border-2 border-orange-300' : ''} relative`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.name}</div>
                        {task.description && (
                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{task.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(task.due_date, task.due_time)}
                        </div>
                        {dueLabel && (
                          <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${labelColor} ml-6`}>
                            {dueLabel}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Delete task"
                        >
                          ×
                        </button>
                        <EditTaskButton task={task} onTaskUpdated={onUpdate} />
                        <button
                          onClick={() => handleDuplicateTask(task)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          title="Duplicate task"
                        >
                          ⎘
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleStar(task.id, task.is_starred)}
                      className="absolute bottom-2 left-2 text-lg hover:scale-110 transition-transform"
                      title={task.is_starred ? 'Unstar task' : 'Star task'}
                    >
                      {task.is_starred ? '★' : '☆'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}