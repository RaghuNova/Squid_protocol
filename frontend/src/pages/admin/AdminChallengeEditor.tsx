import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { CheckCircle2, Save } from 'lucide-react';

type Challenge = Record<string, any>;

const round2Fields = [
  ['title', 'Question title'], ['scenario', 'Full question and intended specification'], ['codeSnippet', 'Code shown to participants'], ['expectedOutput', 'Correct expected answer'], ['referenceSolution', 'Complete admin reference solution']
] as const;
const round3Fields = [
  ['title', 'Question title'], ['description', 'Question description'], ['intendedBehavior', 'Intended behavior'], ['javaCode', 'Java code shown to participants'], ['pythonCode', 'Python code shown to participants'], ['cCode', 'C code shown to participants'], ['inputData', 'Input data'], ['derivationRule', 'Answer derivation rule'], ['expectedFinalKey', 'Correct expected answer'], ['referenceSolution', 'Complete admin reference solution']
] as const;

const ChallengeEditor: React.FC<{ round: 2 | 3; endpoint: string; fields: readonly (readonly [string, string])[] }> = ({ round, endpoint, fields }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const result = await apiRequest<{ challenge: Challenge | null }>(endpoint);
      setChallenge(result.challenge);
      if (!result.challenge) setFeedback(`No active Round ${round} challenge is configured.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not load challenge.');
    }
  };
  useEffect(() => { void load(); }, [endpoint]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!challenge) return;
    setSaving(true);
    setFeedback('');
    try {
      const result = await apiRequest<{ challenge: Challenge }>(endpoint, { method: 'PATCH', body: JSON.stringify({ ...challenge, points: Number(challenge.points) }) });
      setChallenge(result.challenge);
      setFeedback(`Round ${round} challenge and solution saved.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };
  return <section className="p-5 sm:p-7 rounded-2xl bg-[#12151c] border border-gray-800 space-y-5">
    <div><p className="font-mono text-xs text-cyan-300 uppercase tracking-widest">ADMIN ONLY · ROUND {round}</p><h2 className="text-xl font-display font-bold text-white mt-1">{round === 2 ? 'Stage 2 — Broken Logic' : 'Final Debugging Challenge'}</h2></div>
    {feedback && <p role="status" className="text-xs font-mono text-cyan-200">{feedback}</p>}
    {!challenge ? <button onClick={() => void load()} className="px-4 py-2 rounded bg-gray-800 text-white text-xs font-mono">RETRY LOAD</button> : <form onSubmit={save} className="space-y-4">
      {fields.map(([field, label]) => <label key={field} className="block space-y-1"><span className="text-[10px] font-mono uppercase text-gray-400">{label}</span><textarea required rows={field.includes('Code') || field.endsWith('Code') || field === 'referenceSolution' || field === 'scenario' || field === 'description' || field === 'intendedBehavior' ? 5 : 2} value={challenge[field] ?? ''} onChange={event => setChallenge({ ...challenge, [field]: event.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-400" /></label>)}
      <label className="block space-y-1"><span className="text-[10px] font-mono uppercase text-gray-400">Points</span><input type="number" min={0} value={challenge.points ?? 0} onChange={event => setChallenge({ ...challenge, points: Number(event.target.value) })} className="w-full sm:w-40 px-3 py-2 rounded-lg bg-[#090b0f] border border-gray-800 text-white font-mono text-xs" /></label>
      <button disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff004f] text-white text-xs font-mono font-bold disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'SAVING…' : 'SAVE ROUND ' + round + ' CHALLENGE'}</button>
      {feedback.includes('saved') && <CheckCircle2 className="inline w-4 h-4 ml-2 text-green-400" />}
    </form>}
  </section>;
};

export const AdminChallengeEditor: React.FC = () => <div className="space-y-6"><ChallengeEditor round={2} endpoint="/admin/round2-challenge" fields={round2Fields} /><ChallengeEditor round={3} endpoint="/admin/round3-challenge" fields={round3Fields} /></div>;
