import { NextRequest, NextResponse } from "next/server";

const GWCT_PAGE = "http://www.gwct.co.kr/sub/sub_D1";
const GWCT_SEARCH = "http://www.gwct.co.kr/sub/sub_D1/search";

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

    // 1. 먼저 GWCT 페이지에 접속해서 세션 + CSRF 토큰 받기
    const firstResponse = await fetch(GWCT_PAGE, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    const pageHtml = await firstResponse.text();

    // JSESSIONID 추출
    const setCookie = firstResponse.headers.get("set-cookie") || "";
    const sessionMatch = setCookie.match(/JSESSIONID=([^;]+)/);

    if (!sessionMatch) {
      throw new Error("GWCT 세션을 받지 못했습니다.");
    }

    const cookie = `JSESSIONID=${sessionMatch[1]}`;

    // CSRF 토큰 추출
    const csrfMatch =
      pageHtml.match(
        /<meta[^>]+name=["']_csrf["'][^>]+content=["']([^"']+)["']/i
      ) ||
      pageHtml.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']_csrf["']/i
      );

    if (!csrfMatch) {
      throw new Error("GWCT CSRF 토큰을 찾지 못했습니다.");
    }

    const csrfToken = csrfMatch[1];

    // 2. 실제 차량번호 조회
    const formData = new URLSearchParams();
    formData.append("truckNo", truckNo);

    const response = await fetch(GWCT_SEARCH, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",

        Cookie: cookie,

        Origin: "http://www.gwct.co.kr",
        Referer: GWCT_PAGE,

        "X-Csrf-Token": csrfToken,
        "X-Requested-With": "XMLHttpRequest",

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const html = await response.text();

    console.log("GWCT RESULT:");
    console.log(html);

    const noInfo =
  html.includes("text-danger") ||
  html.includes(
    "해당 차량의 반출입 예정 정보가 존재하지 않습니다."
  );

// 테이블 행 추출
const rowMatches = [
  ...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi),
];

const items = rowMatches
  .map((rowMatch) => {
    const rowHtml = rowMatch[1];

    const cells = [
      ...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
    ].map((cell) =>
      cell[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

    if (cells.length < 8) {
      return null;
    }

    const type = cells[0];

    if (type !== "반입" && type !== "반출") {
      return null;
    }

    return {
      type,
      containerNo: cells[1] || "",
      shippingLine: cells[2] || "",
      size: cells[3] || "",
      fe: cells[4] || "",
      receivedAt: cells[5] || "",
      vehicleCardNo: cells[6] || "",
      status: cells[7] || "",
      waitingCount: cells[8] || "",
    };
  })
  .filter((item) => item !== null);

const inbound = items.filter((item) => item?.type === "반입");
const outbound = items.filter((item) => item?.type === "반출");

return NextResponse.json({
  ok: true,
  terminal: "GWCT",
  terminalName: "대통",
  truckNo,
  hasInfo: items.length > 0 && !noInfo,
  message:
    items.length > 0 && !noInfo ? "정보 있음" : "정보 없음",

  counts: {
    total: items.length,
    inbound: inbound.length,
    outbound: outbound.length,
  },

  inbound,
  outbound,
});
  } catch (error) {
    console.error("GWCT 조회 오류:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "GWCT 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}