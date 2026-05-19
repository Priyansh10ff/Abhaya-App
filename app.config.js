import 'dotenv/config'

export default {
  expo: {
    name:    'Abhaya',
    slug:    'abhaya-app',
    version: '1.0.0',
    extra: {
      claudeApiKey: process.env.CLAUDE_API_KEY,
      supabaseUrl:  process.env.SUPABASE_URL,
      supabaseAnon: process.env.SUPABASE_ANON_KEY,
    },
  },
}
