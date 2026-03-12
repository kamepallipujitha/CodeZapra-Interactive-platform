'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateHunterAvatarUrl, getCurrentUser } from '@/lib/auth';
import { getHunterRankByXp } from '@/lib/hunter-rank';
import { getUserCoursesWithProgress } from '@/lib/courses';
import { getTopLeaderboard } from '@/lib/leaderboard';
import { getQuestProgress, getRecentPointEvents, getGamificationOverview, type QuestProgress, type GamificationOverview } from '@/lib/gamification';
import { subscribeToLeaderboard, subscribeToUserGamification } from '@/lib/realtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Flame,
  ChevronRight,
  BookOpen,
  Clock3,
  Zap,
  Target,
  Hash,
} from 'lucide-react';


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [dailyQuests, setDailyQuests] = useState<QuestProgress[]>([]);
  const [recentXpEvents, setRecentXpEvents] = useState<any[]>([]);
  const [gamificationOverview, setGamificationOverview] = useState<GamificationOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const refreshRealtime = () => {
      void (async () => {
        try {
          const [topUsers, overview, questRows, pointRows] = await Promise.all([
            getTopLeaderboard(5),
            getGamificationOverview(user.id).catch(() => null),
            getQuestProgress(user.id, 'daily').catch(() => []),
            getRecentPointEvents(user.id, 5).catch(() => []),
          ]);

          setLeaderboard(topUsers);
          setGamificationOverview(overview);
          setDailyQuests(questRows);
          setRecentXpEvents(pointRows as any[]);
        } catch {
          // noop
        }
      })();
    };

    const unsubscribeUser = subscribeToUserGamification(user.id, refreshRealtime);
    const unsubscribeBoard = subscribeToLeaderboard(refreshRealtime);
    return () => {
      unsubscribeUser();
      unsubscribeBoard();
    };
  }, [user?.id]);

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      const [userCourses, topUsers, overview] = await Promise.all([
        getUserCoursesWithProgress(currentUser.id),
        getTopLeaderboard(5),
        getGamificationOverview(currentUser.id).catch((err) => {
          console.error('Error fetching gamification overview:', err);
          return null;
        }),
      ]);

      let questRows: QuestProgress[] = [];
      let pointRows: any[] = [];
      try {
        [questRows, pointRows] = await Promise.all([
          getQuestProgress(currentUser.id, 'daily'),
          getRecentPointEvents(currentUser.id, 5),
        ]);
      } catch {
        questRows = [];
        pointRows = [];
      }

      setCourses(userCourses);
      setLeaderboard(topUsers);
      setGamificationOverview(overview);
      setDailyQuests(questRows);
      setRecentXpEvents(pointRows);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course: any) => {
    if (!course.modules || course.modules.length === 0) return 0;
    const totalTopics = course.modules.reduce((acc: number, module: any) => acc + (module.topics?.length || 0), 0);
    if (totalTopics === 0) return 0;
    const completedTopics = course.modules.reduce(
      (acc: number, module: any) => acc + (module.topics?.filter((t: any) => t.is_completed)?.length || 0),
      0
    );
    return Math.round((completedTopics / totalTopics) * 100);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded-md bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-72 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  const solvedProblems = Number(gamificationOverview?.problems_solved ?? user?.problems_solved ?? 0);
  const totalXp = Number(gamificationOverview?.total_xp ?? gamificationOverview?.xp ?? user?.total_xp ?? user?.xp ?? user?.total_points ?? 0);
  const userRank = gamificationOverview?.rank ?? user?.rank ?? null;
  const displayName = user?.full_name || 'Learner';
  const streakDays = Math.max(0, Number(gamificationOverview?.current_streak || (user as any)?.streak_days || 0));
  const hunterRank = getHunterRankByXp(totalXp);
  const level = Math.max(1, Math.floor(totalXp / 1000) + 1);
  const xpInLevel = totalXp % 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);

  const currentCourses = courses
    .map((course) => {
      const progress = calculateProgress(course);
      return {
        id: course.id,
        name: course.name,
        progress,
        modulesCount: Array.isArray(course.modules) ? course.modules.length : 0,
        isCompleted: progress >= 100,
      };
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return b.progress - a.progress;
    })
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Level {level} · {hunterRank.label} · {totalXp.toLocaleString()} XP
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2">
            <Flame className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-gray-900">{streakDays} day streak</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <Card className="mb-6 border-gray-200 bg-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Level {level} Progress</span>
            <span className="text-gray-500">{xpInLevel} / 1,000 XP</span>
          </div>
          <Progress value={xpPercent} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border-gray-200 bg-white">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{solvedProblems}</p>
              <p className="text-xs text-gray-500">Problems Solved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{hunterRank.code}</p>
              <p className="text-xs text-gray-500">Current Rank</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Hash className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">#{userRank || '—'}</p>
              <p className="text-xs text-gray-500">Global Rank</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Courses - takes 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Current Courses</CardTitle>
              <Link href="/my-courses" className="flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {currentCourses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
                  <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">No active courses yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-gray-200 text-gray-600 hover:bg-gray-100"
                    onClick={() => router.push('/courses')}
                  >
                    Browse Courses
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCourses.map((course) => (
                    <div key={course.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{course.name}</p>
                          <p className="text-xs text-gray-400">{course.modulesCount} modules</p>
                        </div>
                        <span className="text-xs font-semibold text-purple-600">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock3 className="h-3 w-3" />
                          {course.isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <Link href="/my-courses">Continue</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Quests */}
          {dailyQuests.length > 0 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Daily Quests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyQuests.slice(0, 4).map((quest) => {
                    const pct = quest.target_count > 0 ? Math.min(100, Math.round((quest.progress / quest.target_count) * 100)) : 0;
                    const done = quest.progress >= quest.target_count;
                    return (
                      <div key={quest.quest_id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <p className={`text-sm font-medium ${done ? 'text-green-600' : 'text-gray-900'}`}>
                            {quest.title}
                          </p>
                          <span className="text-xs text-gray-400">
                            {quest.progress}/{quest.target_count}
                          </span>
                        </div>
                        {quest.description && (
                          <p className="mb-2 text-xs text-gray-400">{quest.description}</p>
                        )}
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Streak Card */}
          <Card className="border-gray-200 bg-white">
            <CardContent className="flex flex-col items-center py-6">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
                <Flame className="h-7 w-7 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{streakDays}</p>
              <p className="text-xs text-gray-500">Consecutive Days</p>
              <p className="mt-3 text-center text-xs text-gray-400">Keep your streak going!</p>
            </CardContent>
          </Card>

          {/* Recent XP */}
          <Card className="border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Recent XP</CardTitle>
            </CardHeader>
            <CardContent>
              {recentXpEvents.length === 0 ? (
                <p className="text-sm text-gray-400">No XP activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentXpEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0">
                      <div>
                        <p className="text-sm text-gray-900">{event.event_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-purple-600">
                        +{Number(event.xp_delta ?? event.xp ?? event.points ?? 0)} XP
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Preview */}
          <Card className="border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Top Learners</CardTitle>
              <Link href="/leaderboard" className="text-xs text-purple-600 hover:text-purple-700">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry: any, i: number) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-semibold text-gray-400">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <p className="flex-1 truncate text-sm text-gray-900">{entry.full_name}</p>
                    <span className="text-xs text-gray-500">
                      {Number(entry.total_xp ?? entry.xp ?? entry.total_points ?? 0).toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
