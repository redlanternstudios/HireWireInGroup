import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { job_id } = body
    
    if (!job_id) {
      return NextResponse.json(
        { success: false, error: "job_id required" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Document generation is currently being configured."
    }, { status: 200 })
  } catch (error) {
    console.error("[Generate Documents API Error]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
