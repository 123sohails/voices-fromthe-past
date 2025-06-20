import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(data);
  }
  res.status(405).json({ error: 'Method not allowed' });
} 