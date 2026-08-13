import { NextResponse } from "next/server";

type SendInspectionBody = {
  recipient?: string;
  monthKey?: string;
  vehicleNumber?: string;
  driverName?: string;
  transportCompanyName?: string;
  pdfBase64?: string;
};

async function verifySupabaseUser(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경변수가 없습니다.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
    cache: "no-store",
  });

  return response.ok;
}

export async function POST(request: Request) {
  try {
    const authorized = await verifySupabaseUser(
      request.headers.get("authorization")
    );

    if (!authorized) {
      return NextResponse.json(
        { message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SendInspectionBody;

    const recipient = body.recipient?.trim();
    const monthKey = body.monthKey?.trim();
    const vehicleNumber = body.vehicleNumber?.trim() || "";
    const driverName = body.driverName?.trim() || "";
    const transportCompanyName = body.transportCompanyName?.trim() || "";
    const pdfBase64 = body.pdfBase64?.trim();

    if (!recipient || !monthKey || !pdfBase64) {
      return NextResponse.json(
        { message: "이메일, 점검연월 또는 PDF가 없습니다." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return NextResponse.json(
        { message: "담당자 이메일 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          message:
            "이메일 서버 설정이 아직 없습니다. RESEND_API_KEY와 RESEND_FROM_EMAIL을 설정해주세요.",
        },
        { status: 500 }
      );
    }

    const subject = `[STTP LINK] ${monthKey} 차량 일일점검표${
      vehicleNumber ? ` - ${vehicleNumber}` : ""
    }`;

    const html = `
      <div style="font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;line-height:1.7;color:#222">
        <h2 style="margin:0 0 16px">차량 일일점검표</h2>
        <p><strong>점검연월:</strong> ${monthKey}</p>
        ${
          transportCompanyName
            ? `<p><strong>운송사업자명:</strong> ${escapeHtml(
                transportCompanyName
              )}</p>`
            : ""
        }
        ${
          vehicleNumber
            ? `<p><strong>차량번호:</strong> ${escapeHtml(vehicleNumber)}</p>`
            : ""
        }
        ${
          driverName
            ? `<p><strong>운수종사자명:</strong> ${escapeHtml(driverName)}</p>`
            : ""
        }
        <p style="margin-top:20px">
          STTP LINK에서 생성한 월간 차량 일일점검표를 첨부합니다.
        </p>
      </div>
    `;

    const filename = `STTPLINK_${monthKey.replace(
      "-",
      ""
    )}_${vehicleNumber || "inspection"}.pdf`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        subject,
        html,
        attachments: [
          {
            filename,
            content: pdfBase64,
          },
        ],
      }),
      cache: "no-store",
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend 전송 실패:", resendResult);

      return NextResponse.json(
        {
          message:
            resendResult?.message ||
            "메일 서비스에서 전송을 거부했습니다.",
        },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({
      ok: true,
      emailId: resendResult?.id ?? null,
    });
  } catch (error) {
    console.error("점검표 이메일 API 오류:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "이메일 전송 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}