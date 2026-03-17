import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseXmlTag(xml: string, tag: string): string {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const startIdx = xml.indexOf(open);
  if (startIdx === -1) return '';
  const contentStart = xml.indexOf('>', startIdx) + 1;
  const endIdx = xml.indexOf(close, contentStart);
  if (endIdx === -1) return '';
  let content = xml.substring(contentStart, endIdx).trim();
  // Strip CDATA
  if (content.startsWith('<![CDATA[')) {
    content = content.slice(9, content.lastIndexOf(']]>'));
  }
  return content;
}

function parseItems(xml: string, limit: number): Array<{ title: string; url: string; published: string; snippet: string }> {
  const items: Array<{ title: string; url: string; published: string; snippet: string }> = [];
  let searchFrom = 0;

  while (items.length < limit) {
    const itemStart = xml.indexOf('<item', searchFrom);
    if (itemStart === -1) break;
    const itemEnd = xml.indexOf('</item>', itemStart);
    if (itemEnd === -1) break;
    const itemXml = xml.substring(itemStart, itemEnd + 7);

    const title = parseXmlTag(itemXml, 'title');
    const link = parseXmlTag(itemXml, 'link');
    const pubDate = parseXmlTag(itemXml, 'pubDate');
    const description = parseXmlTag(itemXml, 'description');
    // Also check for enclosure url (common in podcasts)
    let enclosureUrl = '';
    const encMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/);
    if (encMatch) enclosureUrl = encMatch[1];

    const snippet = description.replace(/<[^>]*>/g, '').substring(0, 120);

    items.push({
      title,
      url: link || enclosureUrl,
      published: pubDate,
      snippet,
    });

    searchFrom = itemEnd + 7;
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: feeds, error } = await supabase
      .from('podcast_feeds')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ episodes: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allEpisodes: Array<{
      podcastName: string;
      title: string;
      url: string;
      published: string;
      snippet: string;
    }> = [];

    await Promise.all(
      feeds.map(async (feed: { name: string; rss_url: string }) => {
        try {
          const res = await fetch(feed.rss_url, {
            headers: { 'User-Agent': 'PodcastFetcher/1.0' },
          });
          if (!res.ok) return;
          const xml = await res.text();
          const items = parseItems(xml, 2);
          for (const item of items) {
            allEpisodes.push({ podcastName: feed.name, ...item });
          }
        } catch (e) {
          console.error(`Failed to fetch feed ${feed.name}:`, e);
        }
      })
    );

    // Sort by published date descending
    allEpisodes.sort((a, b) => {
      const da = a.published ? new Date(a.published).getTime() : 0;
      const db = b.published ? new Date(b.published).getTime() : 0;
      return db - da;
    });

    return new Response(JSON.stringify({ episodes: allEpisodes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('fetch-podcasts error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
