// app/folders/[id]/components/tabs/VideoTab.tsx
// ✅ FIXED: Video selection works even after clicking play + proper user names

"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Loader2,
  X,
  ZoomIn,
  Download,
  ExternalLink,
  MessageCircle,
  VideoIcon,
  CheckCircle2,
} from "lucide-react";
import { Product, Comment } from "@/types";
import { VideoCommentsColumn } from "./VideoCommentsColumn";

type VideoData = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  duration?: string;
  width?: number;
  height?: number;
};

type VideoTabProps = {
  myProduct: Product;
  competitors: Product[];
  comparisonId?: string;
};

export function VideoTab({
  myProduct,
  competitors,
  comparisonId,
}: VideoTabProps) {
  const selectedCompetitors = competitors.filter((c) => c.selected);
  const allColumns = 1 + selectedCompetitors.length + 1;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [fullscreenVideo, setFullscreenVideo] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const [productVideos, setProductVideos] = useState<
    Record<string, VideoData[]>
  >({});
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    const allProducts = [myProduct, ...selectedCompetitors];
    loadVideosForProducts(allProducts);
  }, [myProduct.asin, selectedCompetitors.length]);

  useEffect(() => {
    if (comparisonId) {
      loadComments();
    }
  }, [comparisonId]);

  const loadVideosForProducts = async (products: Product[]) => {
    setLoadingVideos(true);

    try {
      const videosMap: Record<string, VideoData[]> = {};

      await Promise.all(
        products.map(async (product) => {
          if (!product.asin) return;

          try {
            const response = await fetch(
              `/api/products/${product.asin}/videos`
            );
            if (response.ok) {
              const data = await response.json();
              videosMap[product.asin] = (data.videos || []).map(
                (v: any, index: number) => ({
                  id: v.videoId || `${product.asin}-video-${index}`,
                  url: v.videoUrl || v.url,
                  thumbnailUrl: v.thumbnailUrl || v.thumbnail,
                  title: v.title || `Video ${index + 1}`,
                  duration: v.duration,
                })
              );
            }
          } catch (error) {
            console.error(`Failed to load videos for ${product.asin}:`, error);
            videosMap[product.asin] = [];
          }
        })
      );

      setProductVideos(videosMap);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadComments = async () => {
    if (loadingComments || !comparisonId) return;

    setLoadingComments(true);
    try {
      const response = await fetch(
        `/api/comments/video?comparisonId=${comparisonId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("[VIDEO COMMENTS] Failed to load:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const getProductVideos = (product: Product): VideoData[] => {
    return productVideos[product.asin || ""] || [];
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideoIds((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  const addComment = async (text: string) => {
    if (selectedVideoIds.length === 0 || !text.trim() || !comparisonId) return;

    setSavingComment(true);
    try {
      const videoUrls = selectedVideoIds.map((id) => {
        for (const videos of Object.values(productVideos)) {
          const video = videos.find((v) => v.id === id);
          if (video) return video.url;
        }
        return id;
      });

      const response = await fetch("/api/comments/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrls: videoUrls,
          content: text.trim(),
          comparisonId: comparisonId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadComments();
        setNewCommentText("");
        setSelectedVideoIds([]);
      }
    } catch (error) {
      console.error("[VIDEO COMMENT] Failed:", error);
      alert("Failed to save comment");
    } finally {
      setSavingComment(false);
    }
  };

  const toggleCommentStatus = async (
    commentId: string,
    newStatus: "open" | "resolved" | "archived"
  ) => {
    try {
      const response = await fetch(`/api/comments/video?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        await loadComments();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      await fetch(`/api/comments/video?id=${commentId}`, { method: "DELETE" });
      await loadComments();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const getCommentCount = (videoId: string): number => {
    const video = Object.values(productVideos)
      .flat()
      .find((v) => v.id === videoId);
    if (!video) return 0;
    return comments.filter((c) => c.videos?.includes(video.url)).length;
  };

  if (loadingVideos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-600">Loading videos...</span>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 p-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${
              allColumns - 1
            }, minmax(0, 1fr)) 280px`,
          }}
        >
          <ProductColumn
            product={myProduct}
            isMyProduct={true}
            videos={getProductVideos(myProduct)}
            selectedVideoIds={selectedVideoIds}
            onToggleVideoSelection={toggleVideoSelection}
            onFullscreen={setFullscreenVideo}
            playingVideo={playingVideo}
            setPlayingVideo={setPlayingVideo}
            getCommentCount={getCommentCount}
          />

          {selectedCompetitors.map((comp) => (
            <ProductColumn
              key={comp.id}
              product={comp}
              isMyProduct={false}
              videos={getProductVideos(comp)}
              selectedVideoIds={selectedVideoIds}
              onToggleVideoSelection={toggleVideoSelection}
              onFullscreen={setFullscreenVideo}
              playingVideo={playingVideo}
              setPlayingVideo={setPlayingVideo}
              getCommentCount={getCommentCount}
            />
          ))}

          <VideoCommentsColumn
            comments={comments}
            newCommentText={newCommentText}
            setNewCommentText={setNewCommentText}
            addComment={addComment}
            deleteComment={deleteComment}
            toggleStatus={toggleCommentStatus}
            selectedVideoIds={selectedVideoIds}
            getVideoUrl={(id) => {
              const video = Object.values(productVideos)
                .flat()
                .find((v) => v.id === id);
              return video?.url || id;
            }}
            onClearSelection={() => setSelectedVideoIds([])}
            loadingComments={loadingComments}
            savingComment={savingComment}
          />
        </div>
      </div>

      {fullscreenVideo && (
        <FullscreenModal
          videoUrl={
            Object.values(productVideos)
              .flat()
              .find((v) => v.id === fullscreenVideo)?.url || fullscreenVideo
          }
          onClose={() => setFullscreenVideo(null)}
          comments={comments.filter((c) =>
            c.videos?.includes(
              Object.values(productVideos)
                .flat()
                .find((v) => v.id === fullscreenVideo)?.url || fullscreenVideo
            )
          )}
        />
      )}
    </>
  );
}

type ProductColumnProps = {
  product: Product;
  isMyProduct: boolean;
  videos: VideoData[];
  selectedVideoIds: string[];
  onToggleVideoSelection: (id: string) => void;
  onFullscreen: (videoId: string) => void;
  playingVideo: string | null;
  setPlayingVideo: (id: string | null) => void;
  getCommentCount: (videoId: string) => number;
};

function ProductColumn({
  product,
  isMyProduct,
  videos,
  selectedVideoIds,
  onToggleVideoSelection,
  onFullscreen,
  playingVideo,
  setPlayingVideo,
  getCommentCount,
}: ProductColumnProps) {
  const bgColor = isMyProduct
    ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50"
    : "bg-slate-50";

  const borderColor = isMyProduct ? "border-emerald-200" : "border-slate-200";
  const textColor = isMyProduct ? "text-emerald-900" : "text-slate-900";
  const subTextColor = isMyProduct ? "text-emerald-700" : "text-slate-600";
  const countColor = isMyProduct ? "text-emerald-600" : "text-slate-500";

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`${bgColor} rounded-lg p-3 border-2 ${borderColor} h-28 flex flex-col justify-between`}
      >
        <h3 className={`font-semibold ${textColor} text-sm line-clamp-1`}>
          {isMyProduct ? "Your Product" : product.name}
        </h3>
        <p className={`text-xs ${subTextColor} line-clamp-2 min-h-8`}>
          {product.name}
        </p>
        <div className="flex items-center justify-between">
          <p className={`text-xs ${countColor} font-medium`}>
            {videos.length} videos
          </p>
          {selectedVideoIds.filter((id) => id.startsWith(product.asin!))
            .length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {
                selectedVideoIds.filter((id) => id.startsWith(product.asin!))
                  .length
              }{" "}
              selected
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {videos.length === 0 ? (
          <div className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <VideoIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No videos</p>
            </div>
          </div>
        ) : (
          videos.map((video) => {
            const isSelected = selectedVideoIds.includes(video.id);
            const isPlaying = playingVideo === video.id;
            const commentCount = getCommentCount(video.id);

            return (
              <div key={video.id} className="relative group">
                <div
                  className={`aspect-video rounded-lg border-2 overflow-hidden transition-all ${
                    isSelected
                      ? "border-blue-500 ring-4 ring-blue-100"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {isPlaying ? (
                    <video
                      src={video.url}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                      onEnded={() => setPlayingVideo(null)}
                    />
                  ) : (
                    <div className="relative w-full h-full bg-slate-900">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <VideoIcon className="h-12 w-12 text-slate-600" />
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-all cursor-pointer"
                        onClick={() => setPlayingVideo(video.id)}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-slate-900 ml-0.5" />
                        </div>
                      </div>

                      {video.duration && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none">
                          {video.duration}
                        </div>
                      )}

                      {commentCount > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full flex items-center gap-1 pointer-events-none">
                          <MessageCircle className="h-3 w-3" />
                          {commentCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ✅ Selection Checkbox - ALWAYS ACCESSIBLE, OUTSIDE video container */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVideoSelection(video.id);
                  }}
                  className={`absolute top-2 left-2 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all z-10 shadow-lg ${
                    isSelected
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white/95 border-white hover:border-blue-400 hover:bg-white"
                  }`}
                  title={
                    isSelected ? "Deselect video" : "Select video for comment"
                  }
                >
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  )}
                </button>

                <div className="mt-2 space-y-2">
                  <h4 className="text-xs font-medium line-clamp-2">
                    {video.title}
                  </h4>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onFullscreen(video.id)}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center justify-center gap-1"
                      title="View fullscreen"
                    >
                      <ZoomIn className="h-3 w-3" />
                      Full
                    </button>

                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = video.url;
                        link.download = `video-${video.id}.mp4`;
                        link.target = "_blank";
                        link.click();
                      }}
                      className="px-2 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>

                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FullscreenModal({
  videoUrl,
  onClose,
  comments,
}: {
  videoUrl: string;
  onClose: () => void;
  comments: Comment[];
}) {
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors p-2 bg-white/10 rounded-lg"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          src={videoUrl}
          controls
          autoPlay
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />

        {comments.length > 0 && (
          <div className="mt-4 bg-white/90 rounded-lg p-4 max-w-md">
            <h4 className="font-semibold mb-2">Comments ({comments.length})</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="text-sm text-slate-700 p-2 bg-slate-50 rounded"
                >
                  <p className="font-semibold text-xs text-slate-500 mb-1">
                    {c.createdBy}
                  </p>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
