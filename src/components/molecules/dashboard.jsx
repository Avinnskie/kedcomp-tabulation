import React from 'react';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, Clock, Medal, School, User, Users } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="flex flex-col w-full md:ml-[200px]">
      <BentoGrid className="min-h-screen p-5">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            icon={item.icon}
            content={item.content} // ini otomatis null jika tidak ada
            className={i === 3 || i === 6 ? 'md:col-span-2' : ''}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

const leaderboard = [
  {
    id: 'Juara 1',
    paymentStatus: 'Alpha',
    totalAmount: '682',
    paymentMethod: 'SMA 1 Pontianak',
  },
  {
    id: 'Juara 2',
    paymentStatus: 'Delta',
    totalAmount: '674',
    paymentMethod: 'SMA 2 Mempawah',
  },
  {
    id: 'Juara 3',
    paymentStatus: 'Beta',
    totalAmount: '670',
    paymentMethod: 'MAN 1 Singkawang',
  },
  {
    id: 'Best Speaker',
    paymentStatus: 'Gamma',
    totalAmount: '660',
    paymentMethod: 'SMK 4 Ketapang',
  },
];

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
    description: 'Understand the impact of effective communication in our lives.',
    icon: <Medal className="h-10 w-10 text-neutral-600" />,
    content: (
      <Table className={'mt-2'}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Juara</TableHead>
            <TableHead>Team Name</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead className="text-right">Total Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map(lead => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.id}</TableCell>
              <TableCell>{lead.paymentStatus}</TableCell>
              <TableCell>{lead.paymentMethod}</TableCell>
              <TableCell className="text-right">{lead.totalAmount}</TableCell>
            </TableRow>
          ))}
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
