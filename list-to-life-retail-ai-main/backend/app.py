import os
import json
import uuid
import traceback
import datetime
import sys
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# --- Add project root to Python path to import modules ---
# This ensures that app.py can find your other Python files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


# --- Import All Custom Business Logic Modules ---
try:
    from stock_engine import get_stock_status, find_smart_substitute, products_by_id, DEFAULT_STORE_ID
    print("✅ stock_engine.py loaded successfully.")
except ImportError as e:
    print(f"❌ ERROR: Could not import from stock_engine.py. {e}")
    sys.exit(1)

try:
    from deal_optimizer import apply_deals_to_list
    print("✅ deal_optimizer.py loaded successfully.")
except ImportError as e:
    print(f"❌ ERROR: Could not import from deal_optimizer.py. {e}")
    sys.exit(1)

try:
    from store_navigator import optimize_shopping_path, STORE_ENTRY_POINT
    print("✅ store_navigator.py loaded successfully.")
except ImportError as e:
    print(f"❌ ERROR: Could not import from store_navigator.py. {e}")
    sys.exit(1)

try:
    from recommendation_engine import get_fbt_recommendations, build_frequently_bought_together_rules, customer_purchases_data
    print("✅ recommendation_engine.py loaded successfully.")
except ImportError as e:
    print(f"❌ ERROR: Could not import from recommendation_engine.py. {e}")
    sys.exit(1)


# --- Initial Application Setup ---
load_dotenv()
app = Flask(__name__)
# Enable CORS to allow requests from your React frontend and support credentials (for sessions)
CORS(app, supports_credentials=True) 
# A secret key is required for Flask sessions to work securely
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'a_very_secret_key_for_your_hackathon')


# --- Initialize Gemini API ---
API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = None
if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        GEMINI_MODEL = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Gemini model initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize Gemini: {e}")
else:
    print("❌ GOOGLE_API_KEY not found. AI features will be disabled.")


# --- Pre-computation and Data Preparation ---
FBT_RULES = build_frequently_bought_together_rules(customer_purchases_data)

# Prepare a string of all available products to ground the AI model.
AVAILABLE_PRODUCTS_FOR_LLM = "Here is a list of Walmart products you can suggest, along with their internal IDs and Categories:\n"
for p_id, p_info in products_by_id.items():
    AVAILABLE_PRODUCTS_FOR_LLM += f"- {p_info['product_name']} (ID: {p_id}, Category: {p_info['category']})\n"
AVAILABLE_PRODUCTS_FOR_LLM += "\n"


# --- Helper Functions ---
def build_gemini_conversation(history, system_prompt, user_message):
    """
    Builds a valid, alternating chat history for the Gemini API.
    """
    contents = [{"role": "user", "parts": [system_prompt]}]
    contents.append({"role": "model", "parts": ["OK, I am ready to help."] })

    if history:
        last_role = "model"
        for turn in history:
            if turn.get('role') != last_role:
                contents.append(turn)
                last_role = turn.get('role')

    contents.append({"role": "user", "parts": [user_message]})
    return contents


# --- Core API Endpoints ---

@app.route('/')
def health_check():
    """A simple health check endpoint to confirm the server is running."""
    return jsonify({"status": "ok", "message": "Walmart AI Assistant backend is running."})

@app.route('/clear_session', methods=['POST'])
def clear_session():
    """Clears all data from the current user's session."""
    session.clear()
    return jsonify({"status": "success", "message": "Session cleared."})

@app.route('/send_message', methods=['POST'])
def handle_send_message():
    """The main chatbot endpoint. Takes a user message and orchestrates AI interaction."""
    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"error": "No message provided."}), 400
    if not GEMINI_MODEL:
        return jsonify({"error": "AI model is not initialized."}), 500

    chat_history = session.get('chat_history', [])
    
    system_prompt = (
            "You are 'Walmart Assistant 360', an intelligent, proactive, and friendly e-commerce and in-store shopping expert. "
            "Your ultimate goal is to provide the best possible shopping experience for the user, from planning to checkout. "
            "You have full knowledge of our product catalog, real-time inventory, current deals, and store layout. "
            "Always prioritize user convenience and savings. Be super helpful and enthusiastic!\n\n"
            
            "Here is our complete product catalog for your reference (use product_id, product_name, category, brand, subcategory, price, attributes):\n" + AVAILABLE_PRODUCTS_FOR_LLM + "\n"
            
            "--- YOUR EXPERTISE & CAPABILITIES ---\n"
            "As Walmart Assistant 360, you can:\n"
            "1.  Generate Shopping Lists: Create comprehensive lists for any occasion (e.g., 'taco night', 'BBQ', 'weekly groceries').\n"
            "2.  Manage Shopping Lists: Add, remove, or replace items in the current list.\n"
            "3.  Provide Real-time Stock Updates: Proactively check availability and suggest smart substitutes for out-of-stock or low-stock items.\n"
            "4.  Optimize Deals & Budget: Calculate total costs, apply relevant deals/coupons, and help users stay within their budget.\n"
            "5.  Guide In-Store Navigation: Provide optimized walking paths for shopping lists based on store layout.\n"
            "6.  Answer Product Questions: Provide details on products, categories, or brands.\n\n"

            "--- IMPORTANT: YOUR RESPONSE FORMAT (JSON or Plain Text) ---\n"
            "You will respond in one of two ways based on user intent. Stick to these formats precisely:\n"
            "A. JSON ACTION COMMAND (ONLY for clear list creation/modification commands): "
            "If the user's request is a clear command to CREATE a new list, ADD items, REMOVE items, or REPLACE items, you MUST output a JSON string following these precise formats. DO NOT include any other text before or after the JSON.\n"
            "   json\n"
            "   { \"action\": \"new_list\", \"list_items\": [{\"product_id\": \"ITEM_ID\", \"quantity\": NUMBER}, ...] }\n"
            "   { \"action\": \"add_item\", \"product_id\": \"ITEM_ID\", \"quantity\": NUMBER }\n"
            "   { \"action\": \"remove_item\", \"product_id\": \"ITEM_ID\" }\n"
            "   { \"action\": \"replace_item\", \"original_product_id\": \"OLD_ITEM_ID\", \"new_product_id\": \"NEW_ITEM_ID\" }\n"
            "   \n"
            "   * For 'new_list' action: Generate a full, relevant list of items (WMK_P### IDs and quantities). The app will then get stock/deal info.\n"
            "   * For 'add_item', 'remove_item', 'replace_item' actions: Only include the necessary product_id(s) and quantity (for add). The app will then handle stock/deal info.\n\n"

            "B. PLAIN TEXT CONVERSATIONAL RESPONSE (for everything else): "
            "If your response is NOT an explicit command for list creation or modification (e.g., answering a question, confirming understanding, acknowledging stock issues, providing navigation guidance, or giving deal advice), respond naturally and politely in plain text. Do NOT include JSON in these responses.\n\n"

            "--- CONVERSATIONAL GUIDANCE ---\n"
            "1.  Strict Product IDs: When generating JSON, ALWAYS use the exact product_id (e.g., 'WMK_P008') from the 'Available Products' list. If a product isn't explicitly listed, politely state you don't carry it.\n"
            "2.  Proactive Stock & Deals: When you receive stock information from the system, proactively and clearly inform the user about out-of-stock/low-stock items. Suggest smart substitutes (if found) by name and ID. Also, highlight any applied deals or suggest items to qualify for deals (e.g., 'If you add one more chip bag, you'll get $1.50 off your snack bundle!').\n"
            "3.  Budget Awareness: If the user mentions a budget or your total calculation exceeds it, offer suggestions to reduce cost (e.g., 'Your list total is $X.Y. Would you like suggestions to reduce cost or achieve a specific budget?').\n"
            "4.  In-Store Navigation: If the user asks for store directions or path optimization (e.g., 'How do I find these items?', 'What's the best route in the store?'), respond by stating you can provide an optimized path and guiding them on how to view it (e.g., 'I can create the most efficient path for you on the screen.').\n"
            "5.  Confirmation & Nudging: After performing an action (adding, removing, replacing), give a brief, friendly confirmation in plain text. Proactively offer further assistance (e.g., 'Okay, I've added milk. Is there anything else I can help you find, or would you like to see your optimized path?').\n"
            "6.  Combining Lists: If the user asks to combine lists, ask for the details of the other list conversationally.\n"
            "7.  Example List Themes: (For 'new_list' action context - ensure these match your products.json) \n"
            "    - For 'Taco night': WMK_P008 (ShinePro Dish Soap), WMK_P010 (DailyHarvest Eggs), WMK_P042 (FarmFresh Fresh Spinach).\n" 
            "    - For 'BBQ' (general): WMK_P001 (SweetDelight Potato Chips (Large)), WMK_P004 (FizzPop Cola (12-pack)), WMK_P006 (FreshHome Laundry Detergent).\n" 
            "    - For 'Breakfast': WMK_P010 (DailyHarvest Eggs), WMK_P036 (DailyHarvest Milk (Gallon)), WMK_P027 (FizzPop Coffee Beans)."

    )

    conversation_for_api = build_gemini_conversation(chat_history, system_prompt, user_message)

    bot_response_text = "Sorry, I couldn't process that request."
    generated_list_items = None
    
    try:
        response = GEMINI_MODEL.generate_content(
            conversation_for_api,
            generation_config={"response_mime_type": "application/json"}
        )
        parsed_json = json.loads(response.text)

        if "list_items" in parsed_json and isinstance(parsed_json['list_items'], list):
            enriched_list = []
            for item in parsed_json["list_items"]:
                original_pid = item.get("product_id")
                original_product_info = products_by_id.get(original_pid)
                if not original_product_info: continue

                stock_info = get_stock_status(original_pid)
                final_pid, final_product_info, is_substituted = original_pid, original_product_info, False
                
                if stock_info["status"] in ["Out of Stock", "Low Stock"]:
                    substitute = find_smart_substitute(original_pid)
                    if substitute:
                        final_pid, final_product_info, is_substituted = substitute['product_id'], substitute, True
                    elif stock_info["status"] == "Out of Stock":
                        continue
                
                final_stock_info = get_stock_status(final_pid)
                enriched_list.append({
                    "product_id": final_pid, "name": final_product_info["product_name"],
                    "quantity": item.get("quantity", 1), "price": final_product_info.get("price", 0),
                    "reason": f"Substituted for {original_product_info['product_name']}" if is_substituted else item.get("reason", ""),
                    "stock": final_stock_info
                })
            
            if not enriched_list and not parsed_json['list_items']:
                 bot_response_text = "I couldn't find any relevant items in the catalog for your request."
            else:
                generated_list_items = enriched_list
                bot_response_text = f"I've created a list with {len(enriched_list)} items for you."
        else:
             bot_response_text = "The AI returned an unexpected format. Please try again."

    except Exception:
        print(f"❌ An error occurred during Gemini API call. Full traceback:")
        print(traceback.format_exc())
        bot_response_text = "I'm having trouble connecting to my brain right now. Please try again."

    chat_history.append({"role": "user", "text": user_message})
    chat_history.append({"role": "model", "text": bot_response_text})
    session['chat_history'] = chat_history

    return jsonify({
        "response": bot_response_text,
        "generated_list": generated_list_items, # Correct key for the frontend
        "chat_history": session.get('chat_history', [])
    })

# --- Endpoints for Other Features ---

@app.route('/api/shopping-list-details', methods=['POST'])
def get_shopping_list_details():
    """Processes a given shopping list with stock, substitute, and deal info."""
    shopping_list = request.json.get('shopping_list', [])
    if not shopping_list:
        return jsonify({"error": "Shopping list not provided."}), 400

    processed_list = []
    for item in shopping_list:
        product_id = item.get("product_id")
        if not product_id or product_id not in products_by_id:
            continue
        
        status_info = get_stock_status(product_id, DEFAULT_STORE_ID)
        item_details = {
            "product_id": product_id, "name": products_by_id[product_id]['product_name'],
            "quantity": item.get('quantity', 1), "status": status_info['status'],
            "message": status_info['message'], "product_details": products_by_id[product_id],
            "substitute": None
        }

        if status_info['status'] in ["Out of Stock", "Low Stock"]:
            substitute = find_smart_substitute(product_id, DEFAULT_STORE_ID)
            if substitute:
                item_details["substitute"] = substitute
        
        processed_list.append(item_details)
    
    deal_results = apply_deals_to_list(processed_list)
    return jsonify(deal_results)

@app.route('/api/optimize-path', methods=['POST'])
def get_optimized_path():
    """Takes a shopping list and returns the most efficient path through the store."""
    shopping_list = request.json.get('shopping_list', [])
    if not shopping_list:
        return jsonify({"error": "Shopping list is empty."}), 400
    optimized_path = optimize_shopping_path(shopping_list, STORE_ENTRY_POINT)
    return jsonify({"optimized_path": optimized_path})

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations_endpoint():
    """Takes a list of product IDs and returns 'Frequently Bought Together' recommendations."""
    product_ids = request.json.get('product_ids', [])
    if not product_ids:
        return jsonify({"recommendations": []})
    recommendations = get_fbt_recommendations(product_ids)
    return jsonify({"recommendations": recommendations})

if __name__ == '__main__':
    app.run(debug=True, port=5000)