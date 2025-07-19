// Deals API endpoint
export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    console.log('Deals Request:', { items });
    
    // Mock deals based on items
    const mockDeals = [
      { 
        item: items[0]?.name || 'Featured Product', 
        discount: 15, 
        description: 'Limited time offer - 15% off!',
        expiry: '2024-02-01'
      },
      { 
        item: 'Bundle Deal', 
        discount: 20, 
        description: 'Buy 3 items, get 20% off total',
        expiry: '2024-01-31'
      }
    ];
    
    return Response.json({
      success: true,
      data: {
        deals: mockDeals,
        savings: mockDeals.reduce((sum, deal) => sum + deal.discount, 0)
      }
    });
    
  } catch (error) {
    console.error('Deals API Error:', error);
    return Response.json(
      { success: false, error: 'Failed to get deals' },
      { status: 500 }
    );
  }
}