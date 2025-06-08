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
import { useSession } from 'next-auth/react';

export function Dashboard() {
  const [winners, setWinners] = useState<any[]>([]);

  useEffect(() => {
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
            name: data.bestSpeaker.name,
            institution: data.bestSpeaker.institution,
            average: data.bestSpeaker.average,
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
                      : w.id === 'Best Speaker'
                        ? '🎖️'
                        : '';

              return (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    {w.id} {emoji}
                  </TableCell>
                  <TableCell>{w.name}</TableCell>
                  <TableCell>{w.institution}</TableCell>
                  <TableCell className="text-right">
                    {w.gf_score !== undefined ? w.gf_score : w.average ? '-' : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {w.total_score !== undefined
                      ? w.total_score
                      : w.average !== undefined
                        ? w.average
                        : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ),
    },
    {
      title: 'Activity',
      description: 'Join the quest for understanding and enlightenment.',
      icon: <Activity className="h-10 w-10 text-neutral-600" />,
      content: (
        <>
          <Alert className={'mt-2'}>
            <Clock className="h-4 w-4" />
            <AlertTitle>09:32 AM</AlertTitle>
            <AlertDescription>Tim “Gamma” memenangkan Round 3 vs Tim “Zeta”</AlertDescription>
          </Alert>
          <Alert className={'mt-2'}>
            <Clock className="h-4 w-4" />
            <AlertTitle>08:45 AM</AlertTitle>
            <AlertDescription>Nilai untuk Round 3 telah diinput oleh Admin A</AlertDescription>
          </Alert>
          <Alert className={'mt-2'}>
            <Clock className="h-4 w-4" />
            <AlertTitle>08:00 AM</AlertTitle>
            <AlertDescription>Tim “Omega” dihapus dari daftar karena absen</AlertDescription>
          </Alert>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <BentoGrid className="min-h-screen p-5">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            icon={item.icon}
            content={item.content}
            className={i === 3 || i === 6 ? 'md:col-span-2' : ''}
          />
        ))}
      </BentoGrid>
    </div>
  );
}
