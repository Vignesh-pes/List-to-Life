import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load all environment variables from .env
load_dotenv()

# --- Use the SERVICE KEY for administrative tasks ---
# The service_role key can bypass Row-Level Security, which is what we need.
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise Exception("Supabase URL or Service Key is missing from .env file.")

# Initialize the Supabase client with the powerful service key
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
print("Supabase client initialized with service_role key.")

def load_json(filename):
    """Safely loads a JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return None

# Load the data
products = load_json("products.json")
inventory = load_json("inventory.json")
substitutions = load_json("substitutions.json")

# --- Bulk Upsert Products ---
if products:
    print(f"Uploading {len(products)} products...")
    try:
        # We can pass the entire list of products in a single request
        supabase.table("products").upsert(products).execute()
        print("✅ Products upload complete.")
    except Exception as e:
        print(f"❌ Error uploading products: {e}")

# --- Bulk Upsert Inventory ---
if inventory:
    print(f"\nUploading {len(inventory)} inventory records...")
    try:
        # Supabase handles date conversion automatically if formatted correctly
        supabase.table("inventory").upsert(inventory).execute()
        print("✅ Inventory upload complete.")
    except Exception as e:
        print(f"❌ Error uploading inventory: {e}")

# --- Format and Bulk Upsert Substitutions ---
if substitutions:
    # Your substitutions.json is nested, so we need to flatten it first
    substitutions_to_upload = []
    for s in substitutions:
        original_id = s.get("original_product_id")
        for sub in s.get("substitutes", []):
            substitutions_to_upload.append({
                "original_product_id": original_id,
                "substitute_product_id": sub.get("substitute_product_id"),
                "substitution_score": sub.get("substitution_score"),
                "reason": sub.get("reason"),
                "type": sub.get("type")
            })
            
    print(f"\nUploading {len(substitutions_to_upload)} substitution records...")
    try:
        supabase.table("substitutions").upsert(substitutions_to_upload).execute()
        print("✅ Substitutions upload complete.")
    except Exception as e:
        print(f"❌ Error uploading substitutions: {e}")

print("\nData import script finished.")