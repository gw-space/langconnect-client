import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { verified } = await request.json()
    
    if (typeof verified !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid verified value' }, { status: 400 })
    }

    const response = await fetch(`${process.env.API_BASE_URL}/collections/${id}/documents/${documentId}/verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify({ verified })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ success: false, message: data.detail || 'Failed to update verification status' }, { status: response.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating verification status:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
} 