import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = Number(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 등록된 오더 조회
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("status", "open")
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "배차 가능한 오더를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    const cargoTypeMap: Record<string, string> = {
        container: "컨테이너",
        construction: "건설장비",
        heavy: "중량물",
      };
      
      const driverCargoType =
        cargoTypeMap[order.cargo_type] ?? order.cargo_type;

    // 2. 화물 종류가 맞는 운송차주 조회
    const { data: drivers, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("id, user_id, cargo_types, regions, phone")
      .contains("cargo_types", [driverCargoType]);

    if (driverError) {
      return NextResponse.json(
        { error: driverError.message },
        { status: 500 }
      );
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({
        success: true,
        matched: 0,
        queued: 0,
        message: "조건에 맞는 운송차주가 없습니다.",
      });
    }

    // 3. 전화번호가 등록된 운송차주만 발송 대기 생성
    const eligibleDrivers = drivers.filter(
      (driver) => driver.phone && driver.phone.trim() !== ""
    );

    if (eligibleDrivers.length === 0) {
      return NextResponse.json({
        success: true,
        matched: drivers.length,
        queued: 0,
        message: "조건은 맞지만 전화번호가 등록된 운송차주가 없습니다.",
      });
    }

    // 4. 향후 실제 발송할 문자 내용
    const message = [
      "[STTPLINK 신규 오더]",
      `화물: ${order.cargo_type}`,
      `상차: ${order.pickup_location || "미입력"}`,
      `하차: ${order.delivery_location || "미입력"}`,
      `운임: ${
        order.freight_price
          ? `금 ${order.freight_price} 원`
          : "협의"
      }`,
      `특이사항: ${order.special_notes || "없음"}`,
      `오더 확인: https://www.sttplink.com/orders`,
    ].join("\n");

    // 5. notification_queue에 pending으로 저장
    const queueRows = eligibleDrivers.map((driver) => ({
      order_id: order.id,
      driver_id: driver.id,
      phone: driver.phone,
      status: "pending",
      message,
    }));

    const { error: queueError } = await supabaseAdmin
      .from("notification_queue")
      .insert(queueRows);

    if (queueError) {
      return NextResponse.json(
        { error: queueError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matched: drivers.length,
      queued: queueRows.length,
      message: `${queueRows.length}명의 운송차주가 문자 발송 대기열에 등록되었습니다.`,
    });
  } catch (error) {
    console.error("notification queue error:", error);

    return NextResponse.json(
      { error: "알림 대기열 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}