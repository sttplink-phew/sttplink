import { NextRequest, NextResponse } from "next/server";

const KITL_URL =
  "https://info.kitl.com/jsp/Mobile/searchCOPINO.jsp";

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const truckNo = String(body.truckNo || "").trim();

    if (!/^\d{4}$/.test(truckNo)) {
      return NextResponse.json(
        {
          ok: false,
          message: "차량번호 뒤 4자리를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const url =
      `${KITL_URL}?cootn2=${encodeURIComponent(truckNo)}&cootn1=`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
      },
      cache: "no-store",
    });

    const html = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "KITL 조회 실패",
          status: response.status,
        },
        { status: 502 }
      );
    }

    const entryMatches = [
      ...html.matchAll(
        /<div class="entry (inbound|outbound)( completed)?".*?>([\s\S]*?)<\/div>\s*<\/div>/gi
      ),
    ];

    const items = entryMatches
      .map((match) => {
        const directionClass = match[1];
        const completed = Boolean(match[2]);
        const entryHtml = match[3];

        const topMatch = entryHtml.match(
          /<div class="entry-top">([\s\S]*?)<\/div>/i
        );

        const topCells = topMatch
          ? [
              ...topMatch[1].matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi),
            ].map((m) => cleanText(m[1]))
          : [];

        const type =
          topCells[0] ||
          (directionClass === "inbound" ? "반입" : "반출");

        const containerNo = topCells[1] || "";

        const badges = [
          ...entryHtml.matchAll(
            /border-radius:20px;[^>]*>([\s\S]*?)<\/div>/gi
          ),
        ].map((m) => cleanText(m[1]));

        const sentMatch = entryHtml.match(
          /전송일시\s*:\s*([^<]+)/i
        );

        return {
          type,
          containerNo,
          shippingStatus: badges[0] || "",
          sizeType: badges[1] || "",
          sentAt: sentMatch ? sentMatch[1].trim() : "",
          completed,
          status: completed ? "완료된 건" : "진행중",
        };
      })
      .filter(
        (item) =>
          item.type === "반입" || item.type === "반출"
      );

    const inbound = items.filter(
      (item) => item.type === "반입"
    );

    const outbound = items.filter(
      (item) => item.type === "반출"
    );

    const activeItems = items.filter(
      (item) => !item.completed
    );

    return NextResponse.json({
      ok: true,
      terminal: "KITL",
      terminalName: "국제",
      truckNo,
      hasInfo: activeItems.length > 0,
      hasAnyInfo: items.length > 0,
      message:
        activeItems.length > 0
          ? "현재 정보 있음"
          : items.length > 0
          ? "완료된 정보만 있음"
          : "정보 없음",

      counts: {
        total: items.length,
        active: activeItems.length,
        inbound: inbound.length,
        outbound: outbound.length,
      },

      inbound,
      outbound,
      items,
    });
  } catch (error) {
    console.error("KITL 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "KITL 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}