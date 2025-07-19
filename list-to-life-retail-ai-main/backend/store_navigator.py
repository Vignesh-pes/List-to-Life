import json
from collections import deque # For Breadth-First Search (BFS)

# --- 1. Data Loading ---
def load_data_local(filename):
    """Helper function to load JSON data locally."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR (store_navigator.py): Data file '{filename}' not found.")
        return {} 
    except json.JSONDecodeError:
        print(f"ERROR (store_navigator.py): Could not decode JSON from '{filename}'.")
        return {} 

# Load store layout data and product data. Assumes these files are in the same directory.
store_layout_data = load_data_local('store_layout.json')
products_data_for_navigator = load_data_local('products.json')

# Extract store graph and product locations for easier access
STORE_GRAPH = store_layout_data.get('layout_graph', {})
PRODUCT_LOCATIONS_MAP = {loc['product_id']: loc['location_node'] for loc in store_layout_data.get('product_locations', [])}
STORE_ENTRY_POINT = store_layout_data.get('entry_point', 'FRONT_DOOR')

# Create product_id to full product details mapping for convenience
PRODUCTS_BY_ID_NAV = {p['product_id']: p for p in products_data_for_navigator}

# --- 2. Core Pathfinding / Optimization Logic ---

def _find_shortest_path_cost(graph: dict, start_node: str, end_node: str) -> float:
    """
    Performs a Breadth-First Search (BFS) to find the shortest path cost (number of hops)
    between two nodes in the store graph. Returns float('inf') if no path.
    """
    if start_node == end_node: return 0
    if start_node not in graph or end_node not in graph: return float('inf')

    queue = deque([(start_node, 0)]) # (node, distance)
    visited = {start_node}

    while queue:
        current_node, dist = queue.popleft()

        if current_node == end_node:
            return dist

        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return float('inf') # No path found


def optimize_shopping_path(shopping_list_items: list, start_from_node: str = STORE_ENTRY_POINT) -> list:
    """
    Optimizes the order of items in a shopping list for efficient in-store navigation.
    Uses a greedy nearest-neighbor approach with BFS for distances.

    Args:
        shopping_list_items (list): A list of dictionaries, each with 'product_id' and 'quantity'.
        start_from_node (str): The starting point in the store (e.g., 'FRONT_DOOR').

    Returns:
        list: A list of dictionaries representing the optimized order of items,
              each with product details and their store location.
    """
    optimized_path_details = []
    items_to_visit = []

    # Populate items_to_visit with products that have known locations
    for item in shopping_list_items:
        product_location_node = PRODUCT_LOCATIONS_MAP.get(item['product_id'])
        if product_location_node:
            product_info = PRODUCTS_BY_ID_NAV.get(item['product_id'])
            if product_info:
                items_to_visit.append({
                    "product_id": item['product_id'],
                    "quantity": item['quantity'],
                    "location_node": product_location_node,
                    "product_name": product_info['product_name'],
                    "category": product_info['category'],
                    "price": product_info['price']
                })
        else:
            print(f"Warning (store_navigator.py): Product ID {item['product_id']} has no defined location in store_layout.json. Skipping for pathfinding.")

    current_node = start_from_node

    while items_to_visit:
        closest_item = None
        min_cost = float('inf')

        for item in items_to_visit:
            cost = _find_shortest_path_cost(STORE_GRAPH, current_node, item['location_node'])
            if cost < min_cost:
                min_cost = cost
                closest_item = item

        if closest_item:
            optimized_path_details.append(closest_item)
            current_node = closest_item['location_node']
            items_to_visit.remove(closest_item)
        else:
            # No path found to any remaining items, or items_to_visit is empty
            print(f"Warning (store_navigator.py): No path found from {current_node} to any remaining items, or no items to optimize.")
            break

    return optimized_path_details


# --- Example Usage (for testing this module independently) ---
if __name__ == "__main__":
    print("--- Running store_navigator.py for independent testing ---")

    # Sample list (use actual WMK_P IDs that are mapped in your store_layout.json)
    sample_shopping_list = [
        {"product_id": "WMK_P006", "quantity": 1}, # Laundry -> AISLE_1
        {"product_id": "WMK_P042", "quantity": 1}, # Spinach -> PRODUCE
        {"product_id": "WMK_P004", "quantity": 2}, # Cola -> AISLE_3
        {"product_id": "WMK_P010", "quantity": 1}, # Eggs -> AISLE_2
        {"product_id": "WMK_P008", "quantity": 1}  # Dish Soap -> AISLE_1
    ]

    # Verify store_layout_data and PRODUCTS_BY_ID_NAV are loaded
    if not STORE_GRAPH or not PRODUCTS_BY_ID_NAV:
        print("ERROR: store_layout.json or products.json not loaded correctly. Cannot run independent test.")
    else:
        print(f"\nOptimizing path starting from {STORE_ENTRY_POINT} for {len(sample_shopping_list)} items:")
        optimized_list = optimize_shopping_path(sample_shopping_list, STORE_ENTRY_POINT)

        if optimized_list:
            current_stop = STORE_ENTRY_POINT
            print(f"Path starts at: {current_stop}")
            for item in optimized_list:
                cost_to_next = _find_shortest_path_cost(STORE_GRAPH, current_stop, item['location_node'])
                print(f"  -> Go to {item['location_node']} (Cost: {cost_to_next} hops) to pick up {item['product_name']}")
                current_stop = item['location_node']

            # Optionally, add path to checkout
            cost_to_checkout = _find_shortest_path_cost(STORE_GRAPH, current_stop, 'CHECKOUT_AREA')
            if cost_to_checkout != float('inf'):
                print(f"  -> Proceed to CHECKOUT_AREA (Cost: {cost_to_checkout} hops)")
            else:
                print("  -> No path found to CHECKOUT_AREA from last item.")
        else:
            print("Could not optimize path. Check if products have locations or if layout graph is valid.")

    print("\n--- store_navigator.py independent testing complete ---")