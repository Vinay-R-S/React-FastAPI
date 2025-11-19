from supabase import create_client, Client
from .config import SUPABASE_URL, SUPABASE_KEY

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment (.env)")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
