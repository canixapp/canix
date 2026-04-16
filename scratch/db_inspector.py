
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

try:
    response = supabase.table("plans").select("*").execute()
    print("PLANS DATA:")
    print(response.data)
except Exception as e:
    print("Error fetching plans:", e)
