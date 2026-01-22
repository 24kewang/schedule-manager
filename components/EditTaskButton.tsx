'use client';

import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { useState } from 'react';

interface EditTaskButtonProps {
  task: Task;
  onTaskUpdated: () => void;
}

export default function EditTaskButton({ task, onTaskUpdated }: EditTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [startDate, setStartDate] = useState(task.start_date || '');
  const [startTime, setStartTime] = useState(task.start_time || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [dueTime, setDueTime] = useState(task.due_time || '');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('tasks')
      .update({
        name,
        description: description || null,
        start_date: startDate || null,
        start_time: startTime || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
      })
      .eq('id', task.id);

    if (!error) {
      setIsOpen(false);
      onTaskUpdated();
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-600 hover:text-gray-700 text-sm font-medium"
        title="Edit task"
      >
        ✎
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 pointer-events-auto">
            <h2 className="text-xl font-bold mb-4">Edit Task</h2>
            <form onSubmit={handleSubmit}>
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

              {task.task_type === 'assignment' && (
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
                  {task.task_type === 'assignment' ? 'Due Date & Time' : 'Date & Time'}
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
                    required={task.task_type === 'assessment'}
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
