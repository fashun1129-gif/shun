import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let passcode: string | undefined;
  try {
    ({ passcode } = await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.SITE_PASSCODE;
  if (!expected) {
    console.error("SITE_PASSCODE is not configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: passcode === expected });
}
