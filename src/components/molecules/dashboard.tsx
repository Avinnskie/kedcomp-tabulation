'use client';

import React, { useEffect, useState } from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, Clock, Medal, School, User, Users } from 'lucide-react';

export function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);

  useEffect(() => {
    // Ambil data log
    fetch('/api/dashboard/logs')
      .then(res => res.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => setLogs([]));

    // Ambil data winners
    fetch('/api/dashboard/winners')
      .then(res => res.json())
      .then(data => {
        const finalWinners = [
          {
            id: 'Juara 1',
            name: data.topTeams[0]?.name,
            institution: data.topTeams[0]?.institution,
            gf_score: data.topTeams[0]?.grandFinalScore,
            total_score: data.topTeams[0]?.totalScore,
          },
          {
            id: 'Juara 2',
            name: data.topTeams[1]?.name,
            institution: data.topTeams[1]?.institution,
            gf_score: data.topTeams[1]?.grandFinalScore,
            total_score: data.topTeams[1]?.totalScore,
          },
          {
            id: 'Juara 3',
            name: data.topTeams[2]?.name,
            institution: data.topTeams[2]?.institution,
            gf_score: data.topTeams[2]?.grandFinalScore,
            total_score: data.topTeams[2]?.totalScore,
          },
          {
            id: 'Best Speaker',
            name: data.bestSpeaker?.name,
            institution: data.bestSpeaker?.institution,
            average: data.bestSpeaker?.average,
          },
        ];
        setWinners(finalWinners);
      });
  }, []);

  const items = [
    {
      title: 'Total Participant',
      description: 'Total KEDCOMP Participant 2025',
      icon: <User className="h-10 w-10 text-neutral-600" />,
    },
    {
      title: 'Total Teams',
      description: 'Total KEDCOMP Teams 2025',
      icon: <Users className="h-10 w-10 text-neutral-600" />,
    },
    {
      title: 'Total Institutions',
      description: 'Total KEDCOMP Institutions 2025',
      icon: <School className="h-10 w-10 text-neutral-600" />,
    },
    {
      title: 'Leaderboard',
      description: 'Top 3 Teams & Best Speaker based on Grand Final',
      icon: <Medal className="h-10 w-10 text-neutral-600" />,
      content: (
        <Table className={'mt-2'}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Juara</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead className="text-right">Grand Final Score</TableHead>
              <TableHead className="text-right">Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {winners.map((w, index) => {
              const emoji =
                w.id === 'Juara 1'
                  ? '🥇'
                  : w.id === 'Juara 2'
                    ? '🥈'
                    : w.id === 'Juara 3'
                      ? '🥉'
                      : '🎖️';

              return (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    {w.id} {emoji}
                  </TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>{w.institution}</TableCell>
                  <TableCell className="text-right">{w.gf_score ?? '-'}</TableCell>
                  <TableCell className="text-right">{w.total_score ?? w.average ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ),
    },
    {
      title: 'Activity',
      description: 'Latest judge submissions and updates.',
      icon: <Activity className="h-10 w-10 text-neutral-600" />,
      content: (
        <div className="mt-2 space-y-2">
          {logs.length > 0 ? (
            logs.map((log, idx) => (
              <Alert key={idx}>
                <Clock className="h-4 w-4" />
                <AlertTitle>{new Date(log.createdAt).toLocaleTimeString()}</AlertTitle>
                <AlertDescription>{log.message}</AlertDescription>
              </Alert>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities.</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
      {items.slice(0, 3).map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          icon={item.icon}
          content={item.content}
        />
      ))}

      <div className="md:col-span-2">
        <BentoGridItem
          title={items[3].title}
          description={items[3].description}
          icon={items[3].icon}
          content={items[3].content}
        />
      </div>

      <div className="">
        {/* <BentoGridItem
          title={items[4].title}
          description={items[4].description}
          icon={items[4].icon}
          content={items[4].content}
          className=""
        /> */}
        <div className="group/bento relative flex flex-col space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-md transition duration-200 hover:shadow-xl dark:border-white/[0.1] dark:bg-neutral-900 h-[330px] overflow-y-auto">
          <div className="w-full flex flex-col items-center transition duration-200 group-hover/bento:translate-x-1">
            {items[4].icon}
            <div className="mt-2 text-xl font-semibold text-neutral-700 dark:text-neutral-200">
              {items[4].title}
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-300">
              {items[4].description}
            </div>
            {items[4].content && <div className="w-full mt-4">{items[4].content}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
