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

    const { vulnerable } = await request.json()
    
    if (typeof vulnerable !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid vulnerable value' }, { status: 400 })
    }

    // vulnerable 필드만 업데이트하기 위해 vulnerable 엔드포인트 사용
    const response = await fetch(`${process.env['API_URL']}/collections/${id}/documents/${documentId}/vulnerable`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify({ vulnerable })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ success: false, message: data.detail || 'Failed to update vulnerable status' }, { status: response.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating vulnerable status:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


