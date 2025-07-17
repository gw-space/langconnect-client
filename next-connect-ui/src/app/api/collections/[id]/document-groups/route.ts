import { NextResponse } from "next/server"
import { serverFetchAPI } from "@/lib/api"

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (limit) queryParams.append('limit', limit)
    if (offset) queryParams.append('offset', offset)

    const url = `/collections/${id}/document-groups${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await serverFetchAPI(url, {
      method: "GET",
    })

    return NextResponse.json({ success: true, data: response }, { status: 200 })
  } catch (error: any) {
    console.error('Failed to fetch document groups:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch document groups' 
    }, { status: 500 })
  }
} 