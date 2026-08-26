import { NextRequest, NextResponse } from "next/server";

const GWCT_PAGE =
  "http://www.gwct.co.kr/sub/sub_D1";

const GWCT_SEARCH =
  "http://www.gwct.co.kr/sub/sub_D1/search";

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSize(value: string) {
  const raw = value
    .trim()
    .toUpperCase();

  // 이미 20 / 40 형태인 경우
  if (raw === "20") {
    return "20";
  }

  if (raw === "40") {
    return "40";
  }

  // GWCT 규격코드
  // 2xxx → 20FT
  // 4xxx → 40FT
  if (/^2\d+/.test(raw)) {
    return "20";
  }

  if (/^4\d+/.test(raw)) {
    return "40";
  }

  // 혹시 문자열 안에 20 / 40이 포함된 경우
  if (raw.includes("20")) {
    return "20";
  }

  if (raw.includes("40")) {
    return "40";
  }

  return raw;
}

function normalizeFE(value: string) {
  const raw = value
    .trim()
    .toUpperCase();

  if (raw === "F") {
    return "FULL";
  }

  if (raw === "E") {
    return "EMPTY";
  }

  if (raw === "FULL") {
    return "FULL";
  }

  if (raw === "EMPTY") {
    return "EMPTY";
  }

  return raw;
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const truckNo = String(
      body.truckNo || ""
    ).trim();

    const phase = String(
      body.phase || "pre"
    );

    if (!/^\d{4}$/.test(truckNo)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "차량번호 뒤 4자리를 입력해주세요.",
        },
        { status: 400 }
      );
    }

    // =====================================
    // 테스트 차량 9999
    // =====================================

    if (truckNo === "9999") {
      // ---------------------------------
      // 게이트 통과 후 테스트
      // ---------------------------------

      if (phase === "post") {
        return NextResponse.json({
          ok: true,

          terminal: "GWCT",
          terminalName: "대통",

          truckNo,
          phase: "post",

          hasInfo: true,
          hasAnyInfo: true,

          message:
            "작업정보 있음",

          counts: {
            total: 1,
            inbound: 1,
            outbound: 0,
          },

          inbound: [
            {
              type: "반입",

              containerNo:
                "TGBU1051939",

              shippingLine:
                "TEST",

              size: "40",
              rawSize: "4500",

              fe: "FULL",

              // 핵심
              yardLocation:
                "A-12-03",

              vehicleCardNo:
                "TEST9999",

              status:
                "일반",

              receivedAt: "",
              waitingCount: "",
            },
          ],

          outbound: [],
        });
      }

      // ---------------------------------
      // 게이트 진입 전 테스트
      // ---------------------------------

      return NextResponse.json({
        ok: true,

        terminal: "GWCT",
        terminalName: "대통",

        truckNo,
        phase: "pre",

        hasInfo: true,
        hasAnyInfo: true,

        message:
          "배차정보 있음",

        counts: {
          total: 1,
          inbound: 1,
          outbound: 0,
        },

        inbound: [
          {
            type: "반입",

            containerNo:
              "TGBU1051939",

            shippingLine:
              "TEST",

            size: "40",
            rawSize: "4500",

            fe: "FULL",

            yardLocation: "",

            vehicleCardNo:
              "TEST9999",

            status:
              "반입예정",

            receivedAt:
              "10:30",

            waitingCount:
              "0",
          },
        ],

        outbound: [],
      });
    }

    // =====================================
    // 실제 GWCT
    // =====================================

    // -------------------------------------
    // 1. 초기 페이지 접속
    // 세션 + CSRF 확보
    // -------------------------------------

    const firstResponse =
      await fetch(GWCT_PAGE, {
        method: "GET",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml",
        },

        cache: "no-store",
      });

    if (!firstResponse.ok) {
      throw new Error(
        `GWCT 초기 접속 실패: ${firstResponse.status}`
      );
    }

    const pageHtml =
      await firstResponse.text();

    // -------------------------------------
    // JSESSIONID
    // -------------------------------------

    const setCookie =
      firstResponse.headers.get(
        "set-cookie"
      ) || "";

    const sessionMatch =
      setCookie.match(
        /JSESSIONID=([^;]+)/
      );

    if (!sessionMatch) {
      throw new Error(
        "GWCT 세션을 받지 못했습니다."
      );
    }

    const cookie =
      `JSESSIONID=${sessionMatch[1]}`;

    // -------------------------------------
    // CSRF
    // -------------------------------------

    const csrfMatch =
      pageHtml.match(
        /<meta[^>]+name=["']_csrf["'][^>]+content=["']([^"']+)["']/i
      ) ||
      pageHtml.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']_csrf["']/i
      );

    if (!csrfMatch) {
      throw new Error(
        "GWCT CSRF 토큰을 찾지 못했습니다."
      );
    }

    const csrfToken =
      csrfMatch[1];

    // =====================================
    // 2. 차량번호 조회
    // =====================================

    const formData =
      new URLSearchParams();

    formData.append(
      "truckNo",
      truckNo
    );

    const response =
      await fetch(GWCT_SEARCH, {
        method: "POST",

        headers: {
          Accept: "*/*",

          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",

          Cookie:
            cookie,

          Origin:
            "http://www.gwct.co.kr",

          Referer:
            GWCT_PAGE,

          "X-Csrf-Token":
            csrfToken,

          "X-Requested-With":
            "XMLHttpRequest",

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        },

        body:
          formData.toString(),

        cache:
          "no-store",
      });

    if (!response.ok) {
      throw new Error(
        `GWCT 조회 실패: ${response.status}`
      );
    }

    const html =
      await response.text();

    console.log(
      `GWCT ${truckNo} RESULT`
    );

    console.log(html);

    // =====================================
    // 정보 없음 여부
    // =====================================

    const noInfo =
      html.includes(
        "해당 차량의 반출입 예정 정보가 존재하지 않습니다."
      );

    // =====================================
    // 테이블 행 파싱
    // =====================================

    const rowMatches = [
      ...html.matchAll(
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
      ),
    ];

    const items = rowMatches
      .map((rowMatch) => {
        const rowHtml =
          rowMatch[1];

        const cells = [
          ...rowHtml.matchAll(
            /<td\b[^>]*>([\s\S]*?)<\/td>/gi
          ),
        ].map((cell) =>
          cleanText(cell[1])
        );

        // ---------------------------------
        // 실제 GWCT 작업표
        //
        // 0 반입/반출
        // 1 컨테이너번호
        // 2 선사
        // 3 사이즈
        // 4 F/E
        // 5 작업위치 = 장치장
        // 6 차량코드
        // 7 상태
        // ---------------------------------

        if (cells.length < 8) {
          return null;
        }

        const type =
          cells[0];

        if (
          type !== "반입" &&
          type !== "반출"
        ) {
          return null;
        }

        const rawSize =
          cells[3] || "";

        const rawFE =
          cells[4] || "";

        const yardLocation =
          cells[5] || "";

        return {
          type,

          containerNo:
            cells[1] || "",

          shippingLine:
            cells[2] || "",

          size:
            normalizeSize(
              rawSize
            ),

          rawSize,

          fe:
            normalizeFE(
              rawFE
            ),

          // =================================
          // 핵심 수정
          // cells[5] = 작업위치 / 장치장
          // =================================

          yardLocation,

          vehicleCardNo:
            cells[6] || "",

          status:
            cells[7] || "",

          // 기존에는 cells[5]를
          // receivedAt으로 잘못 사용했음
          receivedAt: "",

          // 실제 8칸 작업표에는
          // 대기수량 칸 없음
          waitingCount: "",
        };
      })
      .filter(
        (
          item
        ): item is NonNullable<
          typeof item
        > =>
          item !== null
      );

    // =====================================
    // 반입 / 반출 구분
    // =====================================

    const inbound =
      items.filter(
        (item) =>
          item.type === "반입"
      );

    const outbound =
      items.filter(
        (item) =>
          item.type === "반출"
      );

    const hasInfo =
      !noInfo &&
      items.length > 0;

    // =====================================
    // 디버깅
    // =====================================

    console.log(
      `GWCT ${truckNo} PARSED`
    );

    console.log({
      phase,

      noInfo,

      itemCount:
        items.length,

      items,
    });

    // =====================================
    // 응답
    // =====================================

    return NextResponse.json({
      ok: true,

      terminal:
        "GWCT",

      terminalName:
        "대통",

      truckNo,
      phase,

      hasInfo,

      hasAnyInfo:
        items.length > 0,

      message:
        hasInfo
          ? "정보 있음"
          : "정보 없음",

      counts: {
        total:
          items.length,

        inbound:
          inbound.length,

        outbound:
          outbound.length,
      },

      inbound,
      outbound,
    });
  } catch (error) {
    console.error(
      "GWCT 조회 오류:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        terminal:
          "GWCT",

        message:
          error instanceof Error
            ? error.message
            : "GWCT 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}