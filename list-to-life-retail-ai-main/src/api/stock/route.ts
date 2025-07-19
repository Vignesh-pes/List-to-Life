// Stock update API endpoint for real-time inventory
export async function POST(request: Request) {
  try {
    const { id, stock } = await request.json();
    
    console.log('Stock Update:', { id, stock });
    
    // Mock stock update - in real app, this would update database
    // and trigger notifications to connected clients
    
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return Response.json({
      success: true,
      data: {
        product_id: id,
        new_stock: stock,
        updated_at: new Date().toISOString(),
        message: 'Stock updated successfully'
      }
    });
    
  } catch (error) {
    console.error('Stock Update Error:', error);
    return Response.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Return current stock levels for all products
    const mockStockData = [
      { product_id: '1', name: 'Samsung 55" 4K Smart TV', stock: 15, last_updated: new Date().toISOString() },
      { product_id: '2', name: 'Apple AirPods Pro', stock: 30, last_updated: new Date().toISOString() },
      { product_id: '3', name: 'Men\'s Denim Jacket', stock: 8, last_updated: new Date().toISOString() },
      { product_id: '4', name: 'Organic Whole Milk', stock: 200, last_updated: new Date().toISOString() }
    ];
    
    return Response.json({
      success: true,
      data: mockStockData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stock Fetch Error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}