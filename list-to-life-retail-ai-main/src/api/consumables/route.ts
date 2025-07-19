// Consumables tracking API endpoint
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    
    console.log('Consumables Request for user:', user_id);
    
    // Mock consumables that need replacement
    const mockConsumables = [
      {
        id: '1',
        product_name: 'Water Filter',
        purchase_date: '2023-11-15',
        lifespan_days: 90,
        days_remaining: -5,
        replacement_needed: true,
        category: 'Home'
      },
      {
        id: '2',
        product_name: 'Contact Lens Solution',
        purchase_date: '2023-12-01',
        lifespan_days: 60,
        days_remaining: 15,
        replacement_needed: false,
        category: 'Health'
      },
      {
        id: '3',
        product_name: 'Car Air Freshener',
        purchase_date: '2023-12-20',
        lifespan_days: 30,
        days_remaining: -3,
        replacement_needed: true,
        category: 'Automotive'
      }
    ];
    
    // Filter items needing replacement
    const needsReplacement = mockConsumables.filter(item => item.replacement_needed);
    const upcomingReplacements = mockConsumables.filter(item => 
      !item.replacement_needed && item.days_remaining <= 7
    );
    
    return Response.json({
      success: true,
      data: {
        needs_replacement: needsReplacement,
        upcoming_replacements: upcomingReplacements,
        total_tracked: mockConsumables.length,
        suggestions: [
          'Set up auto-delivery for water filters',
          'Consider bulk buying for frequently used items',
          'Enable notifications for replacement reminders'
        ]
      }
    });
    
  } catch (error) {
    console.error('Consumables API Error:', error);
    return Response.json(
      { success: false, error: 'Failed to get consumables data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, product_id, lifespan_days } = await request.json();
    
    console.log('Adding consumable tracking:', { user_id, product_id, lifespan_days });
    
    // Mock adding consumable tracking
    const newConsumable = {
      id: Math.random().toString(36).substr(2, 9),
      user_id,
      product_id,
      purchase_date: new Date().toISOString(),
      lifespan_days,
      created_at: new Date().toISOString()
    };
    
    return Response.json({
      success: true,
      data: newConsumable,
      message: 'Consumable tracking added successfully'
    });
    
  } catch (error) {
    console.error('Add Consumable Error:', error);
    return Response.json(
      { success: false, error: 'Failed to add consumable tracking' },
      { status: 500 }
    );
  }
}