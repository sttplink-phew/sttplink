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

    // ---------------------------------
    // KITL 임시 테스트 계정 8888
    // ---------------------------------
    if (truckNo === "8888") {
      // 2차: 게이트 통과 후
      if (phase === "post") {
        const testItem = {
          type: "반출",
          containerNo: "TEMU7105189",
          shippingStatus: "EMC/E",
          sizeType: "40/DC",
          size: "40",
          fe: "EMPTY",
          sentAt: "13:45",
          completed: true,
          status: "게이트 통과",
          yardLocation: "B-07-11",
        };

        return NextResponse.json({
          ok: true,
          terminal: "KITL",
          terminalName: "국제",
          truckNo,
          phase: "post",

          hasInfo: true,
          hasAnyInfo: true,

          message: "작업정보 있음",

          counts: {
            total: 1,
            active: 1,
            inbound: 0,
            outbound: 1,
          },

          inbound: [],
          outbound: [testItem],
          items: [testItem],
        });
      }

      // 1차: 게이트 진입 전
      const testItem = {
        type: "반출",
        containerNo: "TEMU7105189",
        shippingStatus: "반출예정",
        sizeType: "40/DC",
        size: "40",
        fe: "EMPTY",
        sentAt: "13:20",
        completed: false,
        status: "진행중",
        yardLocation: "",
      };

      return NextResponse.json({
        ok: true,
        terminal: "KITL",
        terminalName: "국제",
        truckNo,
        phase: "pre",

        hasInfo: true,
        hasAnyInfo: true,

        message: "현재 정보 있음",

        counts: {
          total: 1,
          active: 1,
          inbound: 0,
          outbound: 1,
        },

        inbound: [],
        outbound: [testItem],
        items: [testItem],
      });
    }

    // ---------------------------------
    // 실제 KITL 조회
    // ---------------------------------

    const url =
      `${KITL_URL}?cootn2=${encodeURIComponent(
        truckNo
      )}&cootn1=`;

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

    const html =
      await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "KITL 조회 실패",
          status:
            response.status,
        },
        { status: 502 }
      );
    }

    // ---------------------------------
    // KITL 작업정보 블록 추출
    // ---------------------------------

    const entryMatches = [
      ...html.matchAll(
        /<div class="entry (inbound|outbound)( completed)?".*?>([\s\S]*?)<\/div>\s*<\/div>/gi
      ),
    ];

    const items = entryMatches
      .map((match) => {
        const directionClass =
          match[1];

        const completed =
          Boolean(match[2]);

        const entryHtml =
          match[3];

        // -----------------------------
        // 상단 영역
        // 반입/반출 + 컨테이너 번호
        // -----------------------------

        const topMatch =
          entryHtml.match(
            /<div class="entry-top">([\s\S]*?)<\/div>/i
          );

        const topCells =
          topMatch
            ? [
                ...topMatch[1].matchAll(
                  /<div[^>]*>([\s\S]*?)<\/div>/gi
                ),
              ].map((m) =>
                cleanText(m[1])
              )
            : [];

        const type =
          topCells[0] ||
          (directionClass === "inbound"
            ? "반입"
            : "반출");

        // -----------------------------
        // 전체 텍스트
        // -----------------------------

        const fullText =
          cleanText(entryHtml);

        // -----------------------------
        // 컨테이너 번호
        // 영문 4자리 + 숫자 7자리
        // -----------------------------

        const containerMatch =
          fullText.match(
            /\b[A-Z]{4}\d{7}\b/i
          );

        const topContainer =
          topCells.find((cell) =>
            /^[A-Z]{4}\d{7}$/i.test(
              cell.trim()
            )
          );

        const containerNo =
          (
            topContainer ||
            containerMatch?.[0] ||
            ""
          ).toUpperCase();

        // -----------------------------
        // 배지 정보
        // 예:
        // EMC/F
        // 20/DC
        // -----------------------------

        const badges = [
          ...entryHtml.matchAll(
            /border-radius:20px;[^>]*>([\s\S]*?)<\/div>/gi
          ),
        ].map((m) =>
          cleanText(m[1])
        );

        const shippingStatus =
          badges[0] || "";

        const sizeType =
          badges[1] || "";

        // -----------------------------
        // 전송일시
        // -----------------------------

        const sentMatch =
          entryHtml.match(
            /전송일시\s*:\s*([^<]+)/i
          );

        const sentAt =
          sentMatch
            ? sentMatch[1].trim()
            : "";

        // -----------------------------
        // 사이즈
        // 20/DC → 20
        // 40/DC → 40
        // -----------------------------

        const sizeMatch =
          (
            sizeType ||
            fullText
          ).match(
            /\b(20|40|45)\s*\/[A-Z0-9]+\b/i
          );

        const size =
          sizeMatch?.[1] || "";

        // -----------------------------
        // FULL / EMPTY
        // EMC/F → FULL
        // EMC/E → EMPTY
        // -----------------------------

        const feMatch =
          (
            shippingStatus ||
            fullText
          ).match(
            /\/\s*(F|E)\b/i
          );

        const fe =
          feMatch?.[1]?.toUpperCase() === "F"
            ? "FULL"
            : feMatch?.[1]?.toUpperCase() === "E"
              ? "EMPTY"
              : "";

        // -----------------------------
        // 장치장 위치
        // 예:
        // E3-25-02-02
        // X2-19-02-1
        // -----------------------------

        const yardMatch =
          fullText.match(
            /\b[A-Z]\d?-\d{1,2}-\d{1,2}(?:-\d{1,2})?\b/i
          );

        const yardLocation =
          yardMatch?.[0]?.toUpperCase() ||
          "";

        // -----------------------------
        // 상태
        //
        // 중요:
        // KITL의 completed 클래스가
        // 게이트 통과 후 현재 작업에도
        // 붙을 수 있으므로
        // post에서는 완료건이라고
        // 버리지 않는다.
        // -----------------------------

        const status =
          phase === "post"
            ? yardLocation ||
              containerNo
              ? "게이트 통과"
              : "진행중"
            : completed
              ? "완료된 건"
              : "진행중";

        return {
          type,

          containerNo,

          shippingStatus,

          sizeType,

          size,

          fe,

          sentAt,

          completed,

          status,

          yardLocation,
        };
      })

      .filter(
        (item) =>
          item.type === "반입" ||
          item.type === "반출"
      );

    // ---------------------------------
    // 반입 / 반출 분리
    // ---------------------------------

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

    // ---------------------------------
    // 현재 유효 작업
    //
    // pre:
    // 완료되지 않은 배차만 현재정보
    //
    // post:
    // completed 여부와 관계없이
    // 현재 KITL 조회 결과를 사용
    // ---------------------------------

    const activeItems =
      phase === "post"
        ? items
        : items.filter(
            (item) =>
              !item.completed
          );

    // ---------------------------------
    // 응답
    // ---------------------------------

    return NextResponse.json({
      ok: true,

      terminal: "KITL",
      terminalName: "국제",

      truckNo,

      phase,

      hasInfo:
        activeItems.length > 0,

      hasAnyInfo:
        items.length > 0,

      message:
        activeItems.length > 0
          ? phase === "post"
            ? "작업정보 있음"
            : "현재 정보 있음"
          : items.length > 0
            ? "완료된 정보만 있음"
            : "정보 없음",

      counts: {
        total:
          items.length,

        active:
          activeItems.length,

        inbound:
          inbound.length,

        outbound:
          outbound.length,
      },

      inbound,

      outbound,

      items,
    });
  } catch (error) {
    console.error(
      "KITL 조회 오류:",
      error
    );

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