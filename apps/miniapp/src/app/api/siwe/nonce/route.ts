import { NextResponse } from "next/server";

let sequenceCounter = 0;

export async function GET() {
  sequenceCounter++;
  const nonce = BigInt(sequenceCounter);

  return NextResponse.json({ nonce: nonce.toString() });
}
