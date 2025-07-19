// Store Route API endpoint
export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    console.log('Route Request:', { items });
    
    // Mock store routing based on aisles
    const aisleMapping: { [key: string]: string } = {
      'Ground Turkey': 'Aisle 8',
      'Taco Shells': 'Aisle 7',
      'Salsa': 'Aisle 7',
      'Avocados': 'Aisle 9',
      'Shredded Cheese': 'Aisle 8',
      'Burger Patties': 'Aisle 8',
      'Hamburger Buns': 'Aisle 6',
      'BBQ Sauce': 'Aisle 7',
      'Samsung TV': 'Aisle 10',
      'Apple AirPods': 'Aisle 10'
    };
    
    const route = items.map((item: any) => ({
      item: item.name,
      aisle: aisleMapping[item.name] || 'Aisle 1',
      section: getSection(aisleMapping[item.name] || 'Aisle 1')
    }));
    
    // Optimize route order
    const optimizedRoute = route.sort((a, b) => {
      const aisleA = parseInt(a.aisle.replace('Aisle ', ''));
      const aisleB = parseInt(b.aisle.replace('Aisle ', ''));
      return aisleA - aisleB;
    });
    
    return Response.json({
      success: true,
      data: {
        route: optimizedRoute,
        estimatedTime: Math.ceil(optimizedRoute.length * 2.5) + ' minutes',
        totalDistance: optimizedRoute.length * 50 + ' feet'
      }
    });
    
  } catch (error) {
    console.error('Route API Error:', error);
    return Response.json(
      { success: false, error: 'Failed to generate route' },
      { status: 500 }
    );
  }
}

function getSection(aisle: string): string {
  const sectionMap: { [key: string]: string } = {
    'Aisle 1': 'Produce',
    'Aisle 6': 'Bakery',
    'Aisle 7': 'Pantry',
    'Aisle 8': 'Meat & Dairy',
    'Aisle 9': 'Fresh Produce',
    'Aisle 10': 'Electronics',
    'Aisle 12': 'Home & Garden'
  };
  return sectionMap[aisle] || 'General';
}