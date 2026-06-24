import { getAuth } from "@/lib/auth-context"
import { withLog } from "@/lib/with-log"
import { NextRequest, NextResponse } from "next/server"

export const GET = withLog(async (req: NextRequest) => {
  const auth = await getAuth(req)
  if (auth instanceof NextResponse) return auth
  const { keyName } = auth

  return NextResponse.json({keyName})
})