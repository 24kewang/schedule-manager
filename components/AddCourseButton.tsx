'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface AddCourseButtonProps {
  onCourseAdded: () => void;
}

export default function AddCourseButton({ onCourseAdded }: AddCourseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get the highest current display_order
    // const { data: existingCourses } = await supabase
    //   .from('courses')
    //   .select('display_order')
    //   .eq('user_id', user.id)
    //   .order('display_order', { ascending: false })
    //   .limit(1);
    
    // const maxOrder = existingCourses?.[0]?.display_order || 0;
    const newOrder = 0;

    const { error } = await supabase.from('courses').insert({
      user_id: user.id,
      title,
      description: description || null,
      display_order: newOrder,
    });

    if (!error) {
      setTitle('');
      setDescription('');
      setIsOpen(false);
      onCourseAdded();
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        + Add Course
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full border border-gray-200 pointer-events-auto">
            <h2 className="text-xl font-bold mb-4">Add New Course</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Course Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Mathematics 101"
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
                  placeholder="Course details or reminders..."
                  rows={2}
                />
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
                  {loading ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}