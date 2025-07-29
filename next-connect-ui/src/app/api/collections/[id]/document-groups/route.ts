import { NextResponse } from "next/server"
import { serverFetchAPI } from "@/lib/api"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '20'
  const offset = searchParams.get('offset') || '0'
    
  try {
    // 백엔드 API 호출 with query parameters (documents와 동일한 방식)
    const response = await serverFetchAPI(`/collections/${id}/document-groups?limit=${limit}&offset=${offset}`, {
      method: "GET",
    })

    return NextResponse.json({ success: true, data: response }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
} 