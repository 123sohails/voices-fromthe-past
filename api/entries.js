import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { title, author, date, type, content, tags } = req.body;
    if (!title || !author || !date || !type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabase
      .from('entries')
      .insert([{ title, author, date, type, content, tags: tags || [] }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(405).json({ error: 'Method not allowed' });
} 