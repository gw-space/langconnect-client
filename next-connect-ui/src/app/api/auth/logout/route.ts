import { NextResponse } from "next/server"
import { serverFetchAPI } from "@/lib/api"

export async function POST() {
  try {
    // 백엔드 API 호출
    await serverFetchAPI("/auth/signout", {
      method: "POST",
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "로그아웃 중 오류가 발생했습니다." }, { status: 500 })
  }
}

