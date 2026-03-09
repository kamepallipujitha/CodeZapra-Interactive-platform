'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProblemById, submitCode, getProblemSolution } from '@/lib/problems';
import { getCurrentUser } from '@/lib/auth';
import { updateProblemsCompleted } from '@/lib/courses';
import { checkCourseCompletion, completeCourse } from '@/lib/courseCompletion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/code-editor';
import { ArrowLeft, Award, Lock, CheckCircle, FileText, Code } from 'lucide-react';
import { toast } from 'sonner';

function formatProblemField(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && value[0].input !== undefined) {
    return value.map((ex: any, idx: number) =>
      `Example ${idx + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n${ex.explanation ? `Explanation: ${ex.explanation}` : ''}`
    ).join('\n\n');
  }
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

export default function CodeProblemPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.problemId as string;

  const [user, setUser] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [problemId]);

  const loadData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    const maxRetries = 3;
    let solution = null;
    let isApproved = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        solution = await getProblemSolution(currentUser.id, problemId);
        const allowedStatuses = new Set(['algorithm_approved', 'code_failed', 'completed']);
        isApproved = !!solution && (
          allowedStatuses.has(solution.status) ||
          (!!solution.algorithm_explanation && solution.status !== 'algorithm_submitted')
        );
        if (isApproved) break;
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Attempt ${attempt} error:`, error);
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!isApproved) {
      toast.error('You must get your approach approved before writing code.');
      router.push(`/topic/${params.id}/problems/${problemId}/explain`);
      return;
    }

    if (solution && solution.status === 'completed') {
      setIsSolved(true);
      if (solution.code_solution) setSavedCode(solution.code_solution);
    }

    const problemData = await getProblemById(problemId);
    setProblem(problemData);

    if (problemData?.test_cases) {
      try {
        const cases = typeof problemData.test_cases === 'string'
          ? JSON.parse(problemData.test_cases)
          : problemData.test_cases;

        const formattedCases = cases.map((testCase: any) => ({
          input: typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input),
          expected_output: typeof testCase.expectedOutput === 'string'
            ? testCase.expectedOutput
            : JSON.stringify(testCase.expectedOutput),
        }));
        setTestCases(formattedCases);
      } catch (error) {
        console.error('Error parsing test cases:', error);
      }
    }
  };

  const handleRunTests = async (code: string): Promise<any[]> => {
    try {
      const result = await submitCode(user.id, problemId, code, problem.language || 'text');
      if (result.error) {
        toast.error(result.error);
        return testCases.map((tc: any) => ({
          ...tc,
          passed: false,
          actual_output: result.error || 'Verification failed',
        }));
      }

      if (result.allTestsPassed) {
        const xpAwarded = Number(result.xpAwarded ?? result.pointsAwarded ?? 0);
        toast.success(`All tests passed! +${xpAwarded} XP`, {
          icon: <Award className="h-4 w-4 text-yellow-500" />,
          duration: 5000,
        });
      }

      if (result.testResults && result.testResults.length > 0) {
        return result.testResults.map((tr: any, i: number) => ({
          input: testCases[i]?.input || '',
          expected_output: tr.expectedOutput || testCases[i]?.expected_output || '',
          passed: tr.passed,
          actual_output: tr.actualOutput || (tr.passed ? (testCases[i]?.expected_output || '') : 'Output mismatch'),
        }));
      }

      return testCases.map((tc: any) => ({
        ...tc,
        passed: result.allTestsPassed,
        actual_output: result.allTestsPassed ? tc.expected_output : (result.feedback || 'Output mismatch'),
      }));
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred during verification');
      return testCases.map((tc: any) => ({ ...tc, passed: false, actual_output: 'Verification error' }));
    }
  };

  const handleSubmit = async (code: string, results: any[]) => {
    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      setIsSolved(true);
      router.refresh(); // Invalidate Next.js router cache so practice/problems pages reload fresh data
      if (user && problem?.topic_id) {
        const progressResult = await updateProblemsCompleted(user.id, problem.topic_id);
        if (progressResult.allSolved) {
          toast.success('All problems solved! Topic completed!', { duration: 4000 });
          try {
            const { createClient } = await import('@/lib/supabase');
            const supabase = createClient();
            const { data: topicData } = await supabase
              .from('topics')
              .select('module_id, modules!inner(course_id)')
              .eq('id', problem.topic_id)
              .single();

            if (topicData?.modules && Array.isArray(topicData.modules) && topicData.modules[0]?.course_id) {
              const courseId = (topicData.modules[0] as any).course_id;
              const isComplete = await checkCourseCompletion(user.id, courseId);
              if (isComplete) {
                const result = await completeCourse(user.id, courseId);
                if (!result.error) {
                  toast.success(`Course completed! +${result.xpAwarded} XP`, { duration: 6000 });
                }
              }
            }
          } catch (err) {
            console.error('Course completion check failed:', err);
          }
        }
      }
      setTimeout(() => {
        router.push(`/topic/${problem.topic_id}/problems`);
      }, 2000);
    } else {
      toast.error('Some tests failed. Fix your code and try again!');
    }
  };

  if (!problem) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const defaultCode = savedCode || problem.starter_code || `// Write your solution here in any programming language`;

  const getDifficultyColor = (d: string) =>
    d === 'easy' ? 'text-green-600' : d === 'medium' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col text-gray-700">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/topic/${problem.topic_id}/problems`)}
            className="text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Problems
          </Button>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <Code className={`h-4 w-4 ${isSolved ? 'text-green-600' : 'text-purple-600'}`} />
            <h1 className="text-sm font-semibold text-gray-900">{problem.title}</h1>
            {isSolved && (
              <Badge className="bg-green-50 text-green-600 border-green-500/20 text-[10px]">
                <CheckCircle className="mr-1 h-3 w-3" />
                Solved
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs capitalize border-gray-200 ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </Badge>
          {isSolved && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Lock className="h-3 w-3" />
              Read-only
            </span>
          )}
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left: Problem details */}
        <section className="lg:w-1/3 flex flex-col border-r border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <FileText className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Problem Details</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <p className="text-gray-600 text-sm leading-relaxed">{problem.description}</p>

            {problem.constraints && (
              <div>
                <h4 className="text-xs font-semibold text-purple-600 mb-2">Constraints</h4>
                <div className="bg-purple-500/5 border border-purple-200 rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap">
                  {formatProblemField(problem.constraints)}
                </div>
              </div>
            )}

            {problem.examples && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Examples</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap">
                  {formatProblemField(problem.examples)}
                </div>
              </div>
            )}
          </div>

          {/* Console info */}
          <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs text-gray-400 font-mono">
            <p>{testCases.length} test case{testCases.length !== 1 ? 's' : ''} loaded</p>
          </div>
        </section>

        {/* Right: Code editor */}
        <section className="lg:w-2/3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">✨ Supports any language</span> — Write your solution in the language of your choice
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              language={problem.language || 'text'}
              defaultCode={defaultCode}
              testCases={testCases}
              onSubmit={isSolved ? undefined : handleSubmit}
              onRunTests={isSolved ? undefined : handleRunTests}
              readOnly={isSolved}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
