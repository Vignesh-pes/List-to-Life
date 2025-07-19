import json
import math 

def load_data_local(filename):
    """Helper function to load JSON data locally."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError: 
        print(f"Error (deal_optimizer.py): Data file '{filename}' not found.")
        return []
    except json.JSONDecodeError: 
        print(f"Error (deal_optimizer.py): Could not decode JSON from '{filename}'.")
        return []

products_data_local = load_data_local('products.json')
products_by_id_local = {p['product_id']: p for p in products_data_local}
deals_data_local = load_data_local('deals.json')

deals_data_local.sort(key=lambda d: d.get('priority', 0), reverse=True)


def apply_deals_to_list(shopping_list_items: list) -> dict:
    """
    Applies active deals to a given list of shopping items and calculates totals.

    Args:
        shopping_list_items (list): A list of dictionaries, each with 'product_id' and 'quantity'.
                                    Example: [{'product_id': 'WMK_P001', 'quantity': 2}]

    Returns:
        dict: A dictionary containing:
            'processed_items': list of items with applied_discount and final_price.
            'total_before_discount': float.
            'total_discount': float.
            'total_after_discount': float.
            'applied_deals_summary': list of strings describing applied deals.
    """
    processed_items = []
    total_before_discount = 0.0
    total_discount = 0.0
    applied_deals_summary = []

    # Create a mutable copy of the shopping list with full product details for easier processing
    # Each item in `current_processing_list` will be {product_id, quantity, product_name, price, category, etc.}
    current_processing_list = []
    for item in shopping_list_items:
        product_details = products_by_id_local.get(item['product_id'])
        if product_details:
            current_item = {
                "product_id": item['product_id'],
                "quantity": item['quantity'],
                "original_price": product_details['price'],
                "final_price_per_unit": product_details['price'], 
                "applied_discount_per_unit": 0.0,
                "product_name": product_details['product_name'],
                "category": product_details['category'],
                "brand": product_details['brand'],
                "subcategory": product_details.get('subcategory', '') 
            }
            current_processing_list.append(current_item)
            total_before_discount += current_item["original_price"] * current_item["quantity"]
        else:
            print(f"Warning (deal_optimizer.py): Product ID {item['product_id']} not found in products.json. Skipping for deal calculation.")
            current_processing_list.append({
                "product_id": item['product_id'],
                "quantity": item['quantity'],
                "original_price": 0.0,
                "final_price_per_unit": 0.0,
                "applied_discount_per_unit": 0.0,
                "product_name": f"Unknown Product (ID: {item['product_id']})",
                "category": "N/A",
                "brand": "N/A",
                "subcategory": "N/A"
            })

    # Sort processed_items by price (ascending), useful for BOGO deals where lowest price is free
    processed_items_sorted_for_deals = sorted(current_processing_list, key=lambda x: x['original_price'])

    # --- Apply Deals ---
    for deal in deals_data_local:
        if not deal.get('active', False):
            continue 

        if deal['type'] == "BOGO": 
            applicable_units_in_cart = []
            for item in processed_items_sorted_for_deals:
                if item['product_id'] in deal['applicable_product_ids']:
                    for _ in range(item['quantity']):
                        applicable_units_in_cart.append(item) 

            applicable_units_in_cart.sort(key=lambda x: x['original_price'])

            sets_available = math.floor(len(applicable_units_in_cart) / deal['min_quantity_for_deal'])
            free_items_to_discount = sets_available * deal['apply_to_n_lowest_price']

            if free_items_to_discount > 0:
                discount_applied_for_deal = 0.0
                for i in range(min(free_items_to_discount, len(applicable_units_in_cart))):
                    unit_to_discount = applicable_units_in_cart[i]
                    discount_amount_for_unit = unit_to_discount['original_price']

                    # Apply discount directly to the item's final price per unit
                    unit_to_discount['final_price_per_unit'] -= discount_amount_for_unit
                    unit_to_discount['applied_discount_per_unit'] += discount_amount_for_unit
                    discount_applied_for_deal += discount_amount_for_unit

                total_discount += discount_applied_for_deal
                applied_deals_summary.append(
                    f"{deal['deal_name']} applied (-${discount_applied_for_deal:.2f})"
                )
                print(f"DEBUG: Applied BOGO for {deal['deal_name']}. Discount: ${discount_applied_for_deal:.2f}")


        elif deal['type'] == "PERCENTAGE_CATEGORY":
            for item in current_processing_list: 
                if item['category'] == deal['category_restriction'] and \
                   (not deal.get('excluded_subcategories') or item['subcategory'] not in deal['excluded_subcategories']):

                    discount_per_unit = item['original_price'] * (deal['discount_percentage'] / 100)
                    discount_amount_total_for_item = discount_per_unit * item['quantity']

                    item['final_price_per_unit'] -= discount_per_unit
                    item['applied_discount_per_unit'] += discount_per_unit
                    total_discount += discount_amount_total_for_item
                    applied_deals_summary.append(
                        f"{deal['deal_name']} applied to {item['product_name']} (-${discount_amount_total_for_item:.2f})"
                    )
                    print(f"DEBUG: Applied PERCENTAGE_CATEGORY for {item['product_name']}. Discount: ${discount_amount_total_for_item:.2f}")


        elif deal['type'] == "FIXED_AMOUNT_ITEM":
            for item in current_processing_list:
                if item['product_id'] in deal['applicable_product_ids']:
                    discount_per_unit = deal['discount_value']
                    discount_amount_total_for_item = discount_per_unit * item['quantity'] 

                    item['final_price_per_unit'] -= discount_per_unit
                    item['applied_discount_per_unit'] += discount_per_unit
                    total_discount += discount_amount_total_for_item
                    applied_deals_summary.append(
                        f"{deal['deal_name']} applied to {item['product_name']} (-${discount_amount_total_for_item:.2f})"
                    )
                    print(f"DEBUG: Applied FIXED_AMOUNT_ITEM for {item['product_name']}. Discount: ${discount_amount_total_for_item:.2f}")

        elif deal['type'] == "PERCENTAGE_ITEM":
            for item in current_processing_list:
                if item['product_id'] in deal['applicable_product_ids']:
                    discount_per_unit = item['original_price'] * (deal['discount_percentage'] / 100)
                    discount_amount_total_for_item = discount_per_unit * item['quantity']

                    item['final_price_per_unit'] -= discount_per_unit
                    item['applied_discount_per_unit'] += discount_per_unit
                    total_discount += discount_amount_total_for_item
                    applied_deals_summary.append(
                        f"{deal['deal_name']} applied to {item['product_name']} (-${discount_amount_total_for_item:.2f})"
                    )
                    print(f"DEBUG: Applied PERCENTAGE_ITEM for {item['product_name']}. Discount: ${discount_amount_total_for_item:.2f}")

        elif deal['type'] == "BUNDLE_THRESHOLD": 
            applicable_items_in_bundle = [item for item in current_processing_list if item['product_id'] in deal['applicable_product_ids']]
            applicable_count = sum(item['quantity'] for item in applicable_items_in_bundle)

            if applicable_count >= deal['min_quantity_for_deal']:
                num_bundles = math.floor(applicable_count / deal['min_quantity_for_deal'])
                total_bundle_discount = num_bundles * deal['discount_value']

                remaining_discount_to_distribute = total_bundle_discount
                total_value_in_bundle = sum(item['original_price'] * item['quantity'] for item in applicable_items_in_bundle)

                if total_value_in_bundle > 0: 
                    for item in applicable_items_in_bundle:
                        if remaining_discount_to_distribute > 0:
                            item_value_proportion = (item['original_price'] * item['quantity']) / total_value_in_bundle
                            discount_for_this_item = total_bundle_discount * item_value_proportion

                            item['final_price_per_unit'] -= (discount_for_this_item / item['quantity'])
                            item['applied_discount_per_unit'] += (discount_for_this_item / item['quantity'])
                            remaining_discount_to_distribute -= discount_for_this_item

                total_discount += total_bundle_discount
                applied_deals_summary.append(
                    f"{deal['deal_name']} applied (-${total_bundle_discount:.2f})"
                )
                print(f"DEBUG: Applied BUNDLE_THRESHOLD for {deal['deal_name']}. Discount: ${total_bundle_discount:.2f}")


    total_after_discount = total_before_discount - total_discount

    for item in current_processing_list:
        item['final_price_per_unit'] = max(0.0, item['final_price_per_unit'])

    return {
        "processed_items": current_processing_list, 
        "total_before_discount": round(total_before_discount, 2),
        "total_discount": round(total_discount, 2),
        "total_after_discount": round(total_after_discount, 2),
        "applied_deals_summary": applied_deals_summary
    }

if __name__ == "__main__":
    print("--- Running deal_optimizer.py for independent testing ---")

    sample_list = [
        {"product_id": "WMK_P041", "quantity": 3}, 
        {"product_id": "WMK_P006", "quantity": 2}, 
        {"product_id": "WMK_P004", "quantity": 1}, 
        {"product_id": "WMK_P027", "quantity": 1}, 
        {"product_id": "WMK_P008", "quantity": 1}, 
        {"product_id": "WMK_P001", "quantity": 1}, 
        {"product_id": "WMK_P034", "quantity": 2}, 
        {"product_id": "WMK_P035", "quantity": 1}, 
        {"product_id": "WMK_P049", "quantity": 1}, 
        {"product_id": "WMK_P044", "quantity": 1} 
    ]

    total_before_discounts = 0
    for item in sample_list:
        prod_detail = products_by_id_local.get(item['product_id'])
        if prod_detail:
            total_before_discounts += prod_detail['price'] * item['quantity']
    print(f"Total before any discounts: ${total_before_discounts:.2f}\n")

    results = apply_deals_to_list(sample_list)

    print("\n--- Processed Shopping List with Deals ---")
    for item in results['processed_items']:
        print(f"- {item['product_name']} (Qty: {item['quantity']}) "
              f"Original: ${item['original_price']:.2f} "
              f"Final: ${item['final_price_per_unit']:.2f} "
              f"Discount/Unit: ${item['applied_discount_per_unit']:.2f}")

    print(f"\nTotal Before Discount: ${results['total_before_discount']:.2f}")
    print(f"Total Discount Applied: -${results['total_discount']:.2f}")
    print(f"Total After Discount: ${results['total_after_discount']:.2f}")

    print("\nApplied Deals Summary:")
    if results['applied_deals_summary']:
        for summary in results['applied_deals_summary']:
            print(f"- {summary}")
    else:
        print("No deals applied.")

    print("\n--- deal_optimizer.py independent testing complete ---")