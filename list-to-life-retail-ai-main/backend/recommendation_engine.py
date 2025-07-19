import json
from collections import defaultdict
import os 

# --- Data Loading (from local JSONs) ---
def load_data_local(filename):
    """Helper function to load JSON data locally."""
    if not os.path.exists(filename):
        print(f"Error (recommendation_engine.py): Data file '{filename}' not found. Please ensure it's generated.")
        return []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Error (recommendation_engine.py): Could not decode JSON from '{filename}'. Check file format.")
        return []

# Load product data for name lookups and customer purchase history
products_data_recs = load_data_local('products.json')
products_by_id_recs = {p['product_id']: p for p in products_data_recs}
customer_purchases_data = load_data_local('customer_purchases.json')

# --- 1. Core Recommendation Logic: Frequently Bought Together (FBT) ---

# FBT_RULES will be populated by the function call below once when module loads
FBT_RULES = {} # Initialize global FBT_RULES as an empty dict

def build_frequently_bought_together_rules(purchases: list, min_support: int = 2) -> dict:
    """
    Analyzes customer purchase history to find items frequently bought together.
    Returns rules: { product_id: { recommended_product_id: count } }
    """
    if not purchases:
        print("Warning (recs): No purchase data to build FBT rules.")
        return {}

    transactions = defaultdict(list)
    for purchase in purchases:
        if 'invoice_id' in purchase and 'product_id' in purchase:
            transactions[purchase['invoice_id']].append(purchase['product_id'])

    co_occurrences = defaultdict(lambda: defaultdict(int))
    for invoice_id in transactions:
        items_in_transaction = transactions[invoice_id]
        unique_items_in_transaction = list(set(items_in_transaction)) 
        
        for i, item_a in enumerate(unique_items_in_transaction):
            for j, item_b in enumerate(unique_items_in_transaction):
                if item_a != item_b:
                    co_occurrences[item_a][item_b] += 1
    
    fbt_rules_local = {} # Use a local variable for building the rules
    for product_a, related_items in co_occurrences.items():
        sorted_related = sorted(related_items.items(), key=lambda item: item[1], reverse=True)
        
        fbt_rules_local[product_a] = [
            {"product_id": pid, "count": count} 
            for pid, count in sorted_related if count >= min_support
        ]
    
    print(f"DEBUG (recs): Built {len(fbt_rules_local)} FBT rules from {len(transactions)} transactions.")
    return fbt_rules_local # FIX: Return the local fbt_rules_local variable

# Build FBT rules once when the module loads
FBT_RULES.update(build_frequently_bought_together_rules(customer_purchases_data)) # Populate the global FBT_RULES here


def get_fbt_recommendations(current_list_product_ids: list, num_recommendations: int = 3) -> list:
    """
    Provides FBT recommendations based on products already in the current shopping list.
    Prioritizes items that are not already in the list.
    """
    if not FBT_RULES:
        print("Warning (recs): FBT rules not built. No recommendations available.")
        return []

    all_potential_recs = defaultdict(int) # {product_id: total_score}

    for item_id_in_list in current_list_product_ids:
        if item_id_in_list in FBT_RULES:
            for rec in FBT_RULES[item_id_in_list]:
                all_potential_recs[rec['product_id']] += rec['count']
    
    filtered_recs = {
        pid: score for pid, score in all_potential_recs.items() 
        if pid not in current_list_product_ids and pid in products_by_id_recs 
    }
    
    sorted_recs = sorted(filtered_recs.items(), key=lambda item: item[1], reverse=True)
    
    recommendations = []
    for rec_id, score in sorted_recs[:num_recommendations]:
        product_info = products_by_id_recs.get(rec_id)
        if product_info:
            recommendations.append({
                "product_id": rec_id,
                "product_name": product_info['product_name'],
                "reason": f"Frequently bought with items on your list.",
                "score": score
            })
    
    print(f"DEBUG (recs): Generated {len(recommendations)} FBT recommendations for list {current_list_product_ids}.")
    return recommendations

# --- Example Usage (for testing this module independently) ---
if __name__ == "__main__":
    print("--- Running recommendation_engine.py for independent testing ---")
    
    if not customer_purchases_data:
        print("No customer_purchases.json found. Please run generate_data.py first.")
    elif not products_data_recs:
        print("No products.json found. Please run generate_data.py first.")
    else:
        sample_current_list_ids = ["WMK_P001", "WMK_P008", "WMK_P010"] 

        print(f"\nBuilding FBT rules from {len(customer_purchases_data)} purchase records...")
        
        print(f"\nGetting recommendations for current list IDs: {sample_current_list_ids}")
        recs = get_fbt_recommendations(sample_current_list_ids, num_recommendations=5)

        if recs:
            print("Recommendations:")
            for rec in recs:
                print(f"- {rec['product_name']} (ID: {rec['product_id']}) - Reason: {rec['reason']}")
        else:
            print("No recommendations found for the sample list. Try adding more diverse items to customer_purchases.json or adjust min_support.")
    
    print("\n--- recommendation_engine.py independent testing complete ---")