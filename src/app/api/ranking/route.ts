import { getTeamRankings } from '@/src/lib/ranking';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rankings = await getTeamRankings();
    res.status(200).json(rankings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate rankings' });
  }
}
