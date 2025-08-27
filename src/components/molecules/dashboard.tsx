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
            preliminary_score: data.topTeams[0]?.preliminaryScore,
            total_score: data.topTeams[0]?.totalScore,
          },
          {
            id: 'Juara 2',
            name: data.topTeams[1]?.name,
            institution: data.topTeams[1]?.institution,
            preliminary_score: data.topTeams[1]?.preliminaryScore,
            total_score: data.topTeams[1]?.totalScore,
          },
          {
            id: 'Juara 3',
            name: data.topTeams[2]?.name,
            institution: data.topTeams[2]?.institution,
            preliminary_score: data.topTeams[2]?.preliminaryScore,
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
      description: 'Top 3 Teams & Best Speaker based on Preliminary Rounds',
      icon: <Medal className="h-10 w-10 text-neutral-600" />,
      content: (
        <Table className={'mt-2'}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Juara</TableHead>
              <TableHead>Team Name</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead className="text-right">Preliminary Score</TableHead>
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
                  <TableCell className="text-right">{w.preliminary_score ?? '-'}</TableCell>
                  <TableCell className="text-right">{w.total_score ?? w.average ?? '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ),
    },
  ];

  return (
    <div className="py-5">
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">Khatulistiwa English Debating Competition (KEDCOMP)</h1>
        <i>
          <q className="text-lg">What&apos;s is KEDCOMP?</q>
        </i>
        <div className="p-3 border rounded bg-gray-100 mb-3 mt-5">
          KEDCOMP (Khatulistiwa English Debating Competition) adalah ajang kompetisi debat berbahasa
          Inggris tingkat SMA/SMK/MA/sederajat se-Kalimantan Barat. Diselenggarakan oleh UKM POWERS
          Politeknik Negeri Pontianak, kompetisi ini dirancang untuk mendorong siswa mengasah
          kemampuan berpikir kritis dan komunikasi dalam bahasa Inggris.
        </div>
      </div>
      <div className="w-full">
        {/* {items.slice(0, 3).map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          icon={item.icon}
          content={item.content}
        />
      ))} */}

          <BentoGridItem
            title={items[3].title}
            description={items[3].description}
            icon={items[3].icon}
            content={items[3].content}
          />
      </div>
    </div>
  );
}
