import json
import datetime 

# --- 1. Data Loading Functions ---
def load_data(filename):
    """
    Loads JSON data from a specified file.
    Prints an error and returns an empty list if the file is not found or malformed.
    """
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR (stock_engine.py): Data file '{filename}' not found.")
        return [] 
    except json.JSONDecodeError:
        print(f"ERROR (stock_engine.py): Could not decode JSON from '{filename}'. Check file format.")
        return []

# --- Global Data Stores (Loaded from JSON files) ---
# These dictionaries provide fast lookup for product, inventory, and substitution data.
products_data = load_data('products.json')
products_by_id = {p['product_id']: p for p in products_data}

inventory_data = load_data('inventory.json')
inventory_by_store_product = {(inv['store_id'], inv['product_id']): inv for inv in inventory_data}

substitutions_data = load_data('substitutions.json')
substitutions_by_original_id = {sub['original_product_id']: sub['substitutes'] for sub in substitutions_data}

# Define the default demo store ID this engine operates on.
# Ensure this matches the 'store_id' used in your inventory.json
DEFAULT_STORE_ID = "S001" 

# --- 2. Core API Functions for Stock and Substitutions ---

def get_product_stock(product_id: str, store_id: str = DEFAULT_STORE_ID) -> int | None:
    """
    Retrieves the current stock quantity for a given product at a specific store.
    
    Args:
        product_id (str): The unique ID of the product.
        store_id (str): The ID of the store. Defaults to DEFAULT_STORE_ID.

    Returns:
        int: The current stock quantity.
        None: If the product is not found in the specified store's inventory.
    """
    key = (store_id, product_id)
    inventory_record = inventory_by_store_product.get(key)
    if inventory_record:
        return inventory_record['current_stock']
    return None

def get_stock_status(product_id: str, store_id: str = DEFAULT_STORE_ID, 
                     low_stock_threshold: int = 3, days_supply_threshold: float = 1.0) -> dict:
    """
    Determines the stock status of a product (In Stock, Low Stock, Out of Stock).
    Includes a simple prediction of days supply left based on daily sales rate.

    Args:
        product_id (str): The ID of the product to check.
        store_id (str): The ID of the store. Defaults to DEFAULT_STORE_ID.
        low_stock_threshold (int): Quantity at or below which an item is considered "Low Stock".
        days_supply_threshold (float): Days left at or below which an item is "Low Stock".

    Returns:
        dict: A dictionary containing 'status' (str), 'message' (str), 
              'current_stock' (int/None), and 'days_left' (float/None).
    """
    stock = get_product_stock(product_id, store_id)
    
    if stock is None:
        return {
            "status": "Unknown", 
            "message": "Product not found or not stocked at this store.",
            "current_stock": None,
            "days_left": None
        }
    
    inventory_record = inventory_by_store_product.get((store_id, product_id))
    daily_sales_rate = inventory_record.get('daily_sales_rate', 1) # Default to 1 to avoid division by zero
    
    days_left = stock / daily_sales_rate if daily_sales_rate > 0 else float('inf') # Infinity if no sales

    if stock == 0:
        return {
            "status": "Out of Stock",
            "message": "This item is currently out of stock.",
            "current_stock": stock,
            "days_left": 0
        }
    # Check if stock is low based on quantity OR predicted days supply
    elif stock <= low_stock_threshold or days_left < days_supply_threshold:
        return {
            "status": "Low Stock",
            "message": f"Only {stock} left! Expected to last ~{days_left:.1f} day(s).",
            "current_stock": stock,
            "days_left": days_left
        }
    else:
        return {
            "status": "In Stock",
            "message": f"In stock ({stock} available).",
            "current_stock": stock,
            "days_left": days_left
        }

def find_smart_substitute(original_product_id: str, store_id: str = DEFAULT_STORE_ID) -> dict | None:
    """
    Finds the best available substitute for an original product at a given store.
    Prioritizes substitutes based on their 'substitution_score' and current availability.

    Args:
        original_product_id (str): The ID of the product that needs a substitute.
        store_id (str): The ID of the store to check for substitute availability.

    Returns:
        dict: A dictionary containing details of the best available substitute,
              including its name, brand, price, reason for substitution, and score.
        None: If no suitable and available substitute is found.
    """
    potential_substitutes = substitutions_by_original_id.get(original_product_id, [])
    
    # Sort substitutes by substitution_score in descending order (highest score first)
    sorted_substitutes = sorted(potential_substitutes, key=lambda x: x.get('substitution_score', 0), reverse=True)
    
    for sub_info in sorted_substitutes:
        sub_product_id = sub_info['substitute_product_id']
        
        # Ensure the substitute product actually exists in our products data
        if sub_product_id not in products_by_id:
            continue # Skip if substitute product details are missing

        sub_stock_status = get_stock_status(sub_product_id, store_id)
        
        # We only suggest substitutes that are currently "In Stock" or "Low Stock"
        if sub_stock_status['status'] in ["In Stock", "Low Stock"]:
            best_available_substitute = products_by_id.get(sub_product_id)
            
            if best_available_substitute:
                # Add substitution-specific information to the returned product data
                best_available_substitute['substitution_reason'] = sub_info['reason']
                best_available_substitute['substitution_score'] = sub_info['substitution_score']
                best_available_substitute['original_product_id'] = original_product_id # For reference
                return best_available_substitute # Return the first (best scored) available substitute found
                
    return None # No suitable substitute found after checking all options

def update_product_stock(product_id: str, quantity: int, store_id: str = DEFAULT_STORE_ID):
    key = (store_id, product_id)
    if key in inventory_by_store_product:
        inventory_by_store_product[key]['current_stock'] = max(
            0, inventory_by_store_product[key]['current_stock'] - quantity
        )
        save_inventory()



def save_inventory():
    with open('inventory.json', 'w', encoding='utf-8') as f:
        json.dump(list(inventory_by_store_product.values()), f, indent=2)


# --- Example Usage (for testing this module independently) ---
# This block only runs when stock_engine.py is executed directly (python stock_engine.py)
# It will NOT run when imported by app.py.
if __name__ == "__main__":
    print(f"--- Running stock_engine.py for independent testing ---")
    print(f"--- Operating for Store ID: {DEFAULT_STORE_ID} ---")
    
    # --- Test 1: Check a product that is OUT OF STOCK ---
    # Find an actual OOS product ID from your generated inventory.json
    oos_product_id = "WMK_P008" # Example: ShinePro Dish Soap, assuming stock: 0 in inventory.json
    
    print(f"\n--- Scenario: Checking status for {oos_product_id} ---")
    product_name_oos = products_by_id.get(oos_product_id, {}).get('product_name', oos_product_id)
    status_oos = get_stock_status(oos_product_id, DEFAULT_STORE_ID)
    print(f"  Product: {product_name_oos}")
    print(f"  Status: {status_oos['status']} - {status_oos['message']}")
    
    if status_oos['status'] == "Out of Stock":
        substitute_oos = find_smart_substitute(oos_product_id, DEFAULT_STORE_ID)
        if substitute_oos:
            print(f"  Suggested Substitute: {substitute_oos['product_name']} by {substitute_oos['brand']}")
            print(f"    Reason: {substitute_oos['substitution_reason']}")
            print(f"    Price: ${substitute_oos['price']:.2f}")
        else:
            print(f"  No suitable substitute found for {product_name_oos}.")

    # --- Test 2: Check a product that is IN STOCK ---
    in_stock_product_id = "WMK_P004" # Example: FizzPop Cola, assuming it's in stock
    print(f"\n--- Scenario: Checking status for {in_stock_product_id} ---")
    product_name_is = products_by_id.get(in_stock_product_id, {}).get('product_name', in_stock_product_id)
    status_is = get_stock_status(in_stock_product_id, DEFAULT_STORE_ID)
    print(f"  Product: {product_name_is}")
    print(f"  Status: {status_is['status']} - {status_is['message']}")
    print(f"  Guidance: This item is ready for you!")

    print("\n--- stock_engine.py independent testing complete ---")