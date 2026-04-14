import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const credentials = JSON.parse(process.env.GSC_CREDENTIALS!);
    const client = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
    });

    const webmasters = google.webmasters({
      version: "v3",
      auth: client
    });

    const configuredSite = process.env.GSC_SITE_URL?.trim();
    const candidateSites = Array.from(
      new Set(
        [configuredSite, "https://shalean.co.za", "sc-domain:shalean.co.za"].filter(
          Boolean
        ) as string[]
      )
    );

    let responseData: any = null;
    let lastError: string | null = null;

    for (const siteUrl of candidateSites) {
      try {
        const queryResponse = await webmasters.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: "2024-01-01",
            endDate: new Date().toISOString().split("T")[0],
            dimensions: ["query"],
            rowLimit: 10
          }
        });
        responseData = queryResponse.data;
        break;
      } catch (error: any) {
        lastError = error?.message ?? "Unknown Search Console error";
      }
    }

    if (!responseData) {
      throw new Error(
        lastError ?? "Unable to query Search Console for configured site URLs."
      );
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
