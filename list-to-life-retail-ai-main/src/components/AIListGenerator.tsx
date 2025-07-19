import React, { useState } from 'react';
import { Brain, Sparkles, ShoppingCart, Loader2, MessageCircle, Mic, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast'; // Your useToast hook
import { useCart } from '@/hooks/useCart';   // 1. IMPORT YOUR CENTRAL CART HOOK

// Define the structure for items from the AI response
interface AIListItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  reason?: string; // optional substitution reason
}

// Define the structure for the entire AI response
interface AIListResponse {
  items: AIListItem[];
  total: number;
}

const AIListGenerator = () => {
  // All original state management is preserved
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 2. USE THE HOOK to get the functions and data needed
  // This replaces the need for the local 'addedItems' state
  const { addToCart, cartItems } = useCart();
  const { toast } = useToast();

  // 3. HELPER FUNCTION to check if a product is in the main cart
  // This is more reliable as it uses the central cart state
  const isItemInCart = (productId: string) => {
    return cartItems.some(item => item.product_id === productId);
  };

  // 4. VOICE INPUT feature is unchanged
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voice input not supported", description: "Your browser does not support speech recognition.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      setQuery(event.results[0][0].transcript);
    };
    recognition.onerror = (e: any) => {
      console.error('Voice input error:', e);
      toast({ title: "Voice Error", description: "Voice recognition failed. Please try again.", variant: "destructive" });
    };
    recognition.start();
  };

  // 5. GENERATE LIST feature is unchanged
  // It still communicates with your Python backend for AI suggestions
  const generateList = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiResponse = await fetch('http://127.0.0.1:5000/send_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: `Create a shopping list for ${query}` }),
      });

      if (!apiResponse.ok) {
        throw new Error(`Request failed with status ${apiResponse.status}`);
      }

      const data = await apiResponse.json();

      if (data.generated_list && data.generated_list.length > 0) {
        const itemsWithDetails: AIListItem[] = data.generated_list;
        const total = itemsWithDetails.reduce(
          (sum: number, item: any) => sum + (item.price || 0) * item.quantity,
          0
        );
        setResponse({ items: itemsWithDetails, total });
      } else {
        const chatResponse = data.response || "The AI returned a response, but it wasn't a list. Please try rephrasing your request.";
        setError(`AI Assistant: "${chatResponse}"`);
      }
    } catch (err: any) {
      setError(`Failed to connect to the AI service. Is the Python server running? (${err.message})`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 6. REFACTORED to use the addToCart function from the useCart hook
  const handleAddItemToCart = async (item: AIListItem) => {
    await addToCart(item.product_id, item.quantity);
  };

  // 7. REFACTORED to loop and call the hook's function for each item
  const handleAddAllToCart = async () => {
    if (!response) return;

    const itemsToAdd = response.items.filter(item => !isItemInCart(item.product_id));

    if (itemsToAdd.length === 0) {
        toast({ title: "All items are already in your cart!" });
        return;
    }
    
    toast({ title: `Adding ${itemsToAdd.length} item(s) to your cart...`});

    // Use Promise.all to handle all additions
    const addPromises = itemsToAdd.map(item => addToCart(item.product_id, item.quantity));
    await Promise.all(addPromises);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* The entire JSX structure and all UI elements are preserved */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary-light/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Brain className="h-4 w-4" />
          AI-Powered List Generation
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tell us your plans, we’ll create your list
        </h2>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="e.g., Plan a taco night for 4 people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="text-lg py-3 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && generateList()}
            />
            <Button onClick={startVoiceInput} variant="outline" title="Voice Input">
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={generateList}
              disabled={!query.trim() || loading}
              variant="hero"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Generate List
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="p-6 text-destructive flex items-center gap-3">
            <MessageCircle className="h-5 w-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {response && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your AI-Generated Shopping List</CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${response.total.toFixed(2)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full" onClick={handleAddAllToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {response.items.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    {item.reason && (
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800">
                        Substitute: {item.reason}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    {/* 8. This button's logic is now tied to the central cart state */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItemToCart(item)}
                      disabled={isItemInCart(item.product_id)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {isItemInCart(item.product_id) ? 'In Cart' : 'Add'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIListGenerator;