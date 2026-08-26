"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/utils/supabase/client";

type Post = {
  id: number;
  user_id: string;
  category: string;
  title: string;
  body: string;
  created_at: string;
};

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
  created_at: string;
};

const categories = ["자유", "맛집", "현장"];

export default function BoardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [category, setCategory] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [newCategory, setNewCategory] = useState(categories[0]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);

  const [commentBody, setCommentBody] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  useEffect(() => {
    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?next=/board");
        return;
      }

      setUserId(user.id);

      await Promise.all([loadPosts(), loadComments()]);
      setLoading(false);
    }

    initialize();
  }, [router, supabase]);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, user_id, category, title, body, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert(`게시글 조회 오류\n${error.message}`);
      return;
    }

    setPosts((data ?? []) as Post[]);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("community_comments")
      .select("id, post_id, user_id, body, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("댓글 조회 오류:", error);
      return;
    }

    setComments((data ?? []) as Comment[]);
  }

  const filteredPosts = posts.filter((post) => {
    if (category && post.category !== category) return false;
    return true;
  });

  async function savePost() {
    if (!userId) return;

    if (!newTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!newBody.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("community_posts").insert({
      user_id: userId,
      category: newCategory,
      title: newTitle.trim(),
      body: newBody.trim(),
    });

    setSaving(false);

    if (error) {
      alert(`게시글 등록 실패\n${error.message}`);
      return;
    }

    setNewCategory(categories[0]);
    setNewTitle("");
    setNewBody("");
    setShowForm(false);

    await loadPosts();
  }

  async function deletePost(post: Post) {
    if (post.user_id !== userId) return;
    if (!confirm("이 글을 삭제할까요?")) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", userId);

    if (error) {
      alert(`삭제 실패\n${error.message}`);
      return;
    }

    if (selectedPost?.id === post.id) {
      setSelectedPost(null);
    }

    await Promise.all([loadPosts(), loadComments()]);
  }

  async function saveComment() {
    if (!userId || !selectedPost || !commentBody.trim()) return;

    setCommentSaving(true);

    const { error } = await supabase.from("community_comments").insert({
      post_id: selectedPost.id,
      user_id: userId,
      body: commentBody.trim(),
    });

    setCommentSaving(false);

    if (error) {
      alert(`댓글 등록 실패\n${error.message}`);
      return;
    }

    setCommentBody("");
    await loadComments();
  }

  async function deleteComment(comment: Comment) {
    if (comment.user_id !== userId) return;
    if (!confirm("댓글을 삭제할까요?")) return;

    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", userId);

    if (error) {
      alert(`댓글 삭제 실패\n${error.message}`);
      return;
    }

    await loadComments();
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

      <main className="min-h-screen overflow-x-hidden bg-[#080808] px-4 pb-24 pt-24 text-white sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* 상단 */}
          <section className="rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                  STTP LINK
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight">
                  소식 및 추천
                </h1>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  광양항 차주 소식 · 맛집 · 현장 정보
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-zinc-300 transition active:scale-95"
              >
                홈
              </button>
            </div>
          </section>

          {/* 카테고리 + 글쓰기 */}
          <section className="mt-3 rounded-3xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${
                    category === ""
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  전체
                </button>

                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${
                      category === item
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="h-11 shrink-0 rounded-xl bg-orange-600 px-4 text-sm font-black text-white transition active:scale-95"
              >
                글쓰기
              </button>
            </div>
          </section>

          {/* 최근 글 */}
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-sm font-bold text-zinc-300">최근 소식</span>

            <strong className="text-sm text-orange-500">
              {filteredPosts.length}건
            </strong>
          </div>

          <section className="mt-2 space-y-2">
            {filteredPosts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8 text-center">
                <p className="font-bold text-zinc-300">
                  등록된 글이 없습니다.
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => {
                const count = comments.filter(
                  (comment) => comment.post_id === post.id
                ).length;

                return (
                  <button
                    type="button"
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left transition active:scale-[0.99] active:bg-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="rounded-md bg-orange-500/10 px-2 py-1 text-[11px] font-black text-orange-400">
                          {post.category}
                        </span>

                        <h2 className="mt-2 line-clamp-2 text-base font-black leading-6">
                          {post.title}
                        </h2>
                      </div>

                      <span className="shrink-0 text-[11px] text-zinc-600">
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {post.body}
                    </p>

                    <div className="mt-3 text-xs text-zinc-500">
                      댓글 {count}

                      {post.user_id === userId && (
                        <span className="ml-3 font-bold text-orange-400">
                          내가 쓴 글
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </section>
        </div>
      </main>

      {/* 글쓰기 */}
      {showForm && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm">
          <div className="mx-auto my-5 w-full max-w-lg rounded-3xl bg-white p-4 text-zinc-900 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-600">
                  STTP LINK
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  새 글
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-black"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  카테고리
                </span>

                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 outline-none focus:border-orange-500"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">제목</span>

                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="h-12 w-full rounded-xl border border-zinc-200 px-4 outline-none focus:border-orange-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">내용</span>

                <textarea
                  rows={8}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="내용을 입력하세요"
                  className="w-full resize-none rounded-xl border border-zinc-200 p-4 text-sm leading-6 outline-none focus:border-orange-500"
                />
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={savePost}
                className="h-14 w-full rounded-xl bg-orange-600 text-base font-black text-white disabled:bg-zinc-300"
              >
                {saving ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 글 상세 */}
      {selectedPost && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/90 p-3 backdrop-blur-sm">
          <div className="mx-auto my-5 w-full max-w-lg rounded-3xl bg-zinc-950 p-4 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="rounded-md bg-orange-500/10 px-2 py-1 text-xs font-black text-orange-400">
                  {selectedPost.category}
                </span>

                <h2 className="mt-3 text-xl font-black leading-7">
                  {selectedPost.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl font-black"
              >
                ×
              </button>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
              {selectedPost.body}
            </p>

            {selectedPost.user_id === userId && (
              <button
                type="button"
                onClick={() => deletePost(selectedPost)}
                className="mt-4 text-xs font-bold text-red-400"
              >
                이 글 삭제
              </button>
            )}

            <section className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black">댓글</h3>

                <span className="text-sm text-zinc-500">
                  {
                    comments.filter(
                      (comment) => comment.post_id === selectedPost.id
                    ).length
                  }
                  개
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {comments
                  .filter(
                    (comment) => comment.post_id === selectedPost.id
                  )
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-xl bg-zinc-900 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                          {comment.body}
                        </p>

                        {comment.user_id === userId && (
                          <button
                            type="button"
                            onClick={() => deleteComment(comment)}
                            className="shrink-0 text-[11px] font-bold text-red-400"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="mt-3 flex gap-2">
                <textarea
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="댓글을 입력하세요"
                  className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm outline-none focus:border-orange-500"
                />

                <button
                  type="button"
                  disabled={commentSaving || !commentBody.trim()}
                  onClick={saveComment}
                  className="w-16 shrink-0 rounded-xl bg-orange-600 text-sm font-black disabled:bg-zinc-800 disabled:text-zinc-600"
                >
                  등록
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}