"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type PrivateInfo = {
  trailer_number: string;
  trailer_model: string;
  business_name: string;
  business_registration_number: string;
  memo: string;
};

type StoredDocument = {
  id: number;
  title: string;
  category: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

const emptyInfo: PrivateInfo = {
  trailer_number: "",
  trailer_model: "",
  business_name: "",
  business_registration_number: "",
  memo: "",
};

const categories = [
  "사업자등록증",
  "자동차등록증",
  "트레일러 서류",
  "보험 서류",
  "운송 관련 서류",
  "기타",
];

function formatBytes(bytes: number | null) {
  if (!bytes) return "";

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(name: string) {
  const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const base = name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "_")
    .slice(0, 60);

  return `${base || "document"}${ext}`;
}

export default function DriverDocumentsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [info, setInfo] = useState<PrivateInfo>(emptyInfo);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState(categories[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replacingDocument, setReplacingDocument] =
    useState<StoredDocument | null>(null);

  useEffect(() => {
    async function loadPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const [
        { data: driver },
        { data: privateInfo, error: infoError },
        { data: docs, error: docsError },
      ] = await Promise.all([
        supabase
          .from("drivers")
          .select("vehicle_number")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("driver_private_info")
          .select(
            "trailer_number, trailer_model, business_name, business_registration_number, memo"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("driver_documents")
          .select(
            "id, title, category, file_name, file_path, mime_type, file_size, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setVehicleNumber(driver?.vehicle_number ?? "");

      if (infoError) {
        console.error("내 서류함 기본정보 조회 실패:", infoError);
      } else if (privateInfo) {
        setInfo({
          trailer_number: privateInfo.trailer_number ?? "",
          trailer_model: privateInfo.trailer_model ?? "",
          business_name: privateInfo.business_name ?? "",
          business_registration_number:
            privateInfo.business_registration_number ?? "",
          memo: privateInfo.memo ?? "",
        });
      }

      if (docsError) {
        console.error("내 서류함 문서 조회 실패:", docsError);
      } else {
        setDocuments((docs ?? []) as StoredDocument[]);
      }

      setLoading(false);
    }

    loadPage();
  }, [router, supabase]);

  async function savePrivateInfo() {
    if (!userId) return;

    setSavingInfo(true);

    const { error } = await supabase
      .from("driver_private_info")
      .upsert(
        {
          user_id: userId,
          trailer_number: info.trailer_number.trim() || null,
          trailer_model: info.trailer_model.trim() || null,
          business_name: info.business_name.trim() || null,
          business_registration_number:
            info.business_registration_number.trim() || null,
          memo: info.memo.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setSavingInfo(false);

    if (error) {
      alert(`기본정보 저장 실패\n${error.message}`);
      return;
    }

    alert("내 기본정보를 저장했습니다.");
  }

  function openUpload(document?: StoredDocument) {
    setReplacingDocument(document ?? null);
    setDocumentTitle(document?.title ?? "");
    setDocumentCategory(document?.category ?? categories[0]);
    setSelectedFile(null);
    setShowUpload(true);

    window.setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 0);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowed =
      file.type === "application/pdf" || file.type.startsWith("image/");

    if (!allowed) {
      alert("사진 또는 PDF 파일만 보관할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("파일은 10MB 이하만 업로드할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    if (!documentTitle.trim() && !replacingDocument) {
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function uploadDocument() {
    if (!userId || !selectedFile) {
      alert("보관할 파일을 선택해주세요.");
      return;
    }

    if (!documentTitle.trim()) {
      alert("서류 이름을 입력해주세요.");
      return;
    }

    setUploading(true);

    const safeName = sanitizeFileName(selectedFile.name);
    const uniqueName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}_${safeName}`;
    const filePath = `${userId}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from("driver-documents")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: selectedFile.type || undefined,
      });

    if (uploadError) {
      setUploading(false);
      alert(`파일 업로드 실패\n${uploadError.message}`);
      return;
    }

    if (replacingDocument) {
      const { data, error } = await supabase
        .from("driver_documents")
        .update({
          title: documentTitle.trim(),
          category: documentCategory,
          file_name: selectedFile.name,
          file_path: filePath,
          mime_type: selectedFile.type || null,
          file_size: selectedFile.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", replacingDocument.id)
        .eq("user_id", userId)
        .select(
          "id, title, category, file_name, file_path, mime_type, file_size, created_at"
        )
        .single();

      if (error) {
        await supabase.storage.from("driver-documents").remove([filePath]);
        setUploading(false);
        alert(`서류 교체 실패\n${error.message}`);
        return;
      }

      await supabase.storage
        .from("driver-documents")
        .remove([replacingDocument.file_path]);

      setDocuments((current) =>
        current.map((document) =>
          document.id === replacingDocument.id
            ? (data as StoredDocument)
            : document
        )
      );
    } else {
      const { data, error } = await supabase
        .from("driver_documents")
        .insert({
          user_id: userId,
          title: documentTitle.trim(),
          category: documentCategory,
          file_name: selectedFile.name,
          file_path: filePath,
          mime_type: selectedFile.type || null,
          file_size: selectedFile.size,
        })
        .select(
          "id, title, category, file_name, file_path, mime_type, file_size, created_at"
        )
        .single();

      if (error) {
        await supabase.storage.from("driver-documents").remove([filePath]);
        setUploading(false);
        alert(`서류 등록 실패\n${error.message}`);
        return;
      }

      setDocuments((current) => [data as StoredDocument, ...current]);
    }

    setUploading(false);
    setShowUpload(false);
    setSelectedFile(null);
    setReplacingDocument(null);
  }

  async function viewDocument(document: StoredDocument) {
    const { data, error } = await supabase.storage
      .from("driver-documents")
      .createSignedUrl(document.file_path, 300);

    if (error || !data?.signedUrl) {
      alert(`파일 열기 실패\n${error?.message ?? "주소를 만들 수 없습니다."}`);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function downloadDocument(document: StoredDocument) {
    const { data, error } = await supabase.storage
      .from("driver-documents")
      .download(document.file_path);

    if (error || !data) {
      alert(`다운로드 실패\n${error?.message ?? "파일을 받을 수 없습니다."}`);
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = document.file_name || "document";
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
  }

  async function deleteDocument(document: StoredDocument) {
    if (!userId) return;
    if (!confirm(`"${document.title}" 서류를 삭제할까요?`)) return;

    const { error: storageError } = await supabase.storage
      .from("driver-documents")
      .remove([document.file_path]);

    if (storageError) {
      alert(`파일 삭제 실패\n${storageError.message}`);
      return;
    }

    const { error: rowError } = await supabase
      .from("driver_documents")
      .delete()
      .eq("id", document.id)
      .eq("user_id", userId);

    if (rowError) {
      alert(
        `파일은 삭제됐지만 목록 정리에 실패했습니다.\n${rowError.message}`
      );
      return;
    }

    setDocuments((current) =>
      current.filter((target) => target.id !== document.id)
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
          불러오는 중...
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-20 pt-24 text-white">
        <div className="mx-auto w-full max-w-lg">
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                  STTP LINK
                </p>
                <h1 className="mt-1 text-2xl font-black">내 서류함</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  차량 · 트레일러 · 사업자 정보와 필요한 서류를 보관합니다.
                </p>
              </div>

              <Link
                href="/driver/my"
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300"
              >
                내정보
              </Link>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-black">내 기본정보</h2>
              <span className="text-xs text-zinc-500">본인 전용</span>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  차량번호
                </span>
                <input
                  value={vehicleNumber}
                  readOnly
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm text-zinc-400"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                    트레일러 번호
                  </span>
                  <input
                    value={info.trailer_number}
                    onChange={(e) =>
                      setInfo((current) => ({
                        ...current,
                        trailer_number: e.target.value,
                      }))
                    }
                    placeholder="트레일러 번호"
                    className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                  />
                </label>

                <label className="block min-w-0">
                  <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                    트레일러 정보
                  </span>
                  <input
                    value={info.trailer_model}
                    onChange={(e) =>
                      setInfo((current) => ({
                        ...current,
                        trailer_model: e.target.value,
                      }))
                    }
                    placeholder="모델 · 형식"
                    className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  상호 / 사업자명
                </span>
                <input
                  value={info.business_name}
                  onChange={(e) =>
                    setInfo((current) => ({
                      ...current,
                      business_name: e.target.value,
                    }))
                  }
                  placeholder="예: STTP물류"
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  사업자등록번호
                </span>
                <input
                  inputMode="numeric"
                  value={info.business_registration_number}
                  onChange={(e) =>
                    setInfo((current) => ({
                      ...current,
                      business_registration_number: e.target.value,
                    }))
                  }
                  placeholder="필요할 때 바로 확인할 수 있게 보관"
                  className="h-12 w-full rounded-xl border border-white/10 bg-zinc-800 px-4 text-sm outline-none focus:border-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-500">
                  메모
                </span>
                <textarea
                  rows={3}
                  value={info.memo}
                  onChange={(e) =>
                    setInfo((current) => ({
                      ...current,
                      memo: e.target.value,
                    }))
                  }
                  placeholder="필요한 정보를 간단히 메모하세요."
                  className="w-full resize-none rounded-xl border border-white/10 bg-zinc-800 p-4 text-sm outline-none focus:border-orange-500"
                />
              </label>

              <button
                type="button"
                onClick={savePrivateInfo}
                disabled={savingInfo}
                className="h-12 w-full rounded-xl bg-orange-600 text-sm font-black disabled:bg-zinc-700"
              >
                {savingInfo ? "저장 중..." : "기본정보 저장"}
              </button>
            </div>
          </section>

          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">보관 서류</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  사진 · PDF / 파일당 최대 10MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => openUpload()}
                className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-black"
              >
                + 서류 추가
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-6 text-center">
                <div className="text-3xl">📁</div>
                <p className="mt-2 text-sm text-zinc-400">
                  아직 보관한 서류가 없습니다.
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  사업자등록증, 자동차등록증 등을 사진이나 PDF로 보관할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-white/10 bg-zinc-800/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xl">
                        {document.mime_type?.includes("pdf") ? "PDF" : "🖼️"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-black">
                              {document.title}
                            </div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {document.category}
                              {document.file_size
                                ? ` · ${formatBytes(document.file_size)}`
                                : ""}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => viewDocument(document)}
                            className="h-9 rounded-lg border border-white/10 bg-zinc-900 text-xs font-bold"
                          >
                            보기
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadDocument(document)}
                            className="h-9 rounded-lg border border-white/10 bg-zinc-900 text-xs font-bold"
                          >
                            저장
                          </button>

                          <button
                            type="button"
                            onClick={() => openUpload(document)}
                            className="h-9 rounded-lg border border-white/10 bg-zinc-900 text-xs font-bold"
                          >
                            교체
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteDocument(document)}
                            className="h-9 rounded-lg border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-300"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="mt-4 px-2 text-center text-[11px] leading-5 text-zinc-600">
            보관 파일은 공개 주소가 아닌 본인 전용 비공개 저장소에 보관됩니다.
          </p>
        </div>
      </main>

      {showUpload && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm">
          <div className="mx-auto my-6 w-full max-w-md rounded-3xl bg-white p-4 text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600">
                  {replacingDocument ? "서류 교체" : "서류 보관"}
                </p>
                <h2 className="mt-1 text-xl font-black">내 서류함</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">서류 이름</span>
                <input
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="예: 사업자등록증"
                  className="h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">분류</span>
                <select
                  value={documentCategory}
                  onChange={(e) => setDocumentCategory(e.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold">
                  {replacingDocument ? "새 파일 선택" : "파일 선택"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm"
                />
              </label>

              {selectedFile && (
                <div className="rounded-xl bg-zinc-100 p-3 text-sm">
                  <div className="font-bold">{selectedFile.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {formatBytes(selectedFile.size)}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={uploadDocument}
                disabled={uploading}
                className="h-12 w-full rounded-xl bg-orange-600 text-sm font-black text-white disabled:bg-zinc-300"
              >
                {uploading
                  ? "업로드 중..."
                  : replacingDocument
                  ? "새 파일로 교체"
                  : "서류 보관"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}