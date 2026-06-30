import { NextResponse, type NextRequest } from "next/server";

// Lets app store reviewers sign in via a one-time URL instead of typing credentials.
// Rotate REVIEW_BYPASS_KEY after each store approval.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key || key !== process.env.REVIEW_BYPASS_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // TODO: exchange for a Clerk sign-in token and redirect into the authed app.
  return NextResponse.redirect(new URL("/demo", request.url));
}
