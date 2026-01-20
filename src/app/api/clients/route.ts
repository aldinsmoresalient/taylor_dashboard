import { NextResponse } from 'next/server';
import { ALL_CLIENTS, type APIResponse } from '@/types';
import { getClientDisplayName } from '@/lib/utils';

export async function GET() {
  try {
    const clients = ALL_CLIENTS.map(client => ({
      id: client,
      name: getClientDisplayName(client),
    }));
    
    const filterOptions = [
      { id: 'all', name: 'All Clients' },
      { id: 'non-westlake', name: 'All (Excl. Westlake)' },
      ...clients,
    ];
    
    const response: APIResponse<typeof filterOptions> = {
      success: true,
      data: filterOptions,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Clients API Error:', error);
    
    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}
