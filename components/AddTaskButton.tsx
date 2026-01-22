'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface AddTaskButtonProps {
  courseId: string;
  onTaskAdded: () => void;
}

export default function AddTaskButton({ courseId, onTaskAdded }: AddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskType, setTaskType] = useState<'assignment' | 'assessment'>('assignment');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('tasks').insert({
      course_id: courseId,
      task_type: taskType,
      name,
      description: description || null,
      start_date: startDate || null,
      start_time: startTime || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
      is_completed: false,
    });

    if (!error) {
      setName('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setDueDate('');
      setDueTime('');
      setIsOpen(false);
      onTaskAdded();
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        + Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="assignment"
                      checked={taskType === 'assignment'}
                      onChange={(e) => setTaskType(e.target.value as 'assignment')}
                      className="mr-2"
                    />
                    Assignment
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="assessment"
                      checked={taskType === 'assessment'}
                      onChange={(e) => setTaskType(e.target.value as 'assessment')}
                      className="mr-2"
                    />
                    Assessment
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Task Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Final Exam"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Task details..."
                  rows={2}
                />
              </div>

              {taskType === 'assignment' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {taskType === 'assignment' ? 'Due Date & Time' : 'Date & Time'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="time"
                    required={taskType === 'assessment'}
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}