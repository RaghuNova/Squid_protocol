import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../services/api';
import { FileQuestion, Edit2, CheckCircle2, X } from 'lucide-react';
import { AdminChallengeEditor } from './AdminChallengeEditor';

interface QuestionItem {
  id: string;
  orderIndex: number;
  topic: string;
  prompt: string;
  codeSnippet?: string | null;
  options: { id: string; text: string }[];
  correctOption: string;
  explanation: string;
  isActive: boolean;
}

export const AdminQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQ, setEditingQ] = useState<QuestionItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (editingQ) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [editingQ]);

  const handleCloseModal = () => {
    setEditingQ(null);
    triggerRef.current?.focus();
  };

  const fetchQuestions = async () => {
    try {
      const res = await apiRequest<{ success: boolean; questions: QuestionItem[] }>('/admin/questions');
      setQuestions(res.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQ) return;

    try {
      const questionUpdate = {
        topic: editingQ.topic,
        prompt: editingQ.prompt,
        codeSnippet: editingQ.codeSnippet,
        options: editingQ.options,
        correctOption: editingQ.correctOption,
        explanation: editingQ.explanation,
        isActive: editingQ.isActive
      };
      await apiRequest(`/admin/questions/${editingQ.id}`, {
        method: 'PATCH',
        body: JSON.stringify(questionUpdate)
      });
      setFeedback(`Question #${editingQ.orderIndex} saved.`);
      setEditingQ(null);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-gray-800 pb-5">
        <span className="font-mono text-xs text-[#ff004f] uppercase tracking-widest flex items-center gap-1.5">
          <FileQuestion className="w-4 h-4" />
          CHALLENGE BANK & SOLUTION ENGINE
        </span>
        <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight mt-1">
          Question Matrix & Answer Key
        </h1>
        <p className="text-xs font-mono text-gray-400 mt-1">
          Review prompts, code snippets, choices, and verified keys. Round 1 scoring is fixed by the event rules.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 text-cyan-300 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Edit Modal */}
      {editingQ && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-question-dialog-title" className="bg-[#12151c] rounded-2xl border border-gray-700 p-6 sm:p-8 max-w-2xl w-full space-y-4 my-8 shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 id="edit-question-dialog-title" className="font-display font-bold text-lg text-white">
                Edit Question #{editingQ.orderIndex} ({editingQ.topic})
              </h3>
              <button type="button" onClick={handleCloseModal} aria-label="Close edit question dialog" className="text-gray-400 hover:text-white p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 font-mono text-xs">
              <div>
                <label htmlFor="question-topic" className="text-gray-400 uppercase block mb-1">Topic</label>
                <input
                  type="text"
                  id="question-topic"
                  value={editingQ.topic}
                  onChange={(e) => setEditingQ({ ...editingQ, topic: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-sm focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f]"
                  required
                />
              </div>

              <div>
                <label htmlFor="question-prompt" className="text-gray-400 uppercase block mb-1">Prompt</label>
                <textarea
                  id="question-prompt"
                  rows={3}
                  value={editingQ.prompt}
                  onChange={(e) => setEditingQ({ ...editingQ, prompt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="question-code-snippet" className="text-gray-400 uppercase block mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={2}
                  id="question-code-snippet"
                  value={editingQ.codeSnippet || ''}
                  onChange={(e) => setEditingQ({ ...editingQ, codeSnippet: e.target.value || null })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-cyan-300 font-mono text-xs"
                />
              </div>

              <div>
                <div>
                  <label htmlFor="question-correct-option" className="text-gray-400 uppercase block mb-1">Correct Answer Choice</label>
                  <select
                    id="question-correct-option"
                    value={editingQ.correctOption}
                    onChange={(e) => setEditingQ({ ...editingQ, correctOption: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-sm font-bold"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

              </div>

              <div>
                <label htmlFor="question-explanation" className="text-gray-400 uppercase block mb-1">Explanation</label>
                <textarea
                  rows={2}
                  id="question-explanation"
                  value={editingQ.explanation}
                  onChange={(e) => setEditingQ({ ...editingQ, explanation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-gray-300 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#ff004f] text-white hover:bg-[#ff2e7e] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="p-5 rounded-2xl bg-[#12151c] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#ff004f]/20 text-[#ff004f] font-bold">
                  Q{q.orderIndex}
                </span>
                <span className="font-mono text-xs text-gray-400">{q.topic}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#00e676] font-bold">
                  KEY: {q.correctOption}
                </span>
                <button
                  onClick={(e) => { triggerRef.current = e.currentTarget; setEditingQ(q); }}
                  aria-label={`Edit question ${q.orderIndex}`}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            <p className="text-gray-200 text-sm font-medium leading-relaxed">{q.prompt}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-400 pt-1">
              {q.options?.map((opt) => (
                <div key={opt.id} className={`p-2 rounded-lg border ${opt.id === q.correctOption ? 'border-[#00e676]/40 bg-[#00e676]/10 text-white' : 'border-gray-800 bg-black/40'}`}>
                  <strong>{opt.id}:</strong> {opt.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-7 space-y-2">
        <h2 className="font-display font-bold text-2xl text-white">Later Round Questions & Solutions</h2>
        <p className="text-xs font-mono text-gray-500">These fields load and save through administrator-only APIs. Participant challenge APIs omit expected answers and reference solutions.</p>
      </div>
      <AdminChallengeEditor />
    </div>
  );
};
