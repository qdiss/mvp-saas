// app/folders/[id]/components/tabs/VideoCommentsColumn.tsx
// ✅ 100% IDENTICAL to CommentsColumn.tsx

"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Loader2,
  Check,
  MoreVertical,
  VideoIcon,
  Archive,
  Trash2,
} from "lucide-react";
import { Comment } from "@/types";

type VideoCommentsColumnProps = {
  comments: Comment[];
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  addComment: (text: string) => void;
  deleteComment: (commentId: string) => void;
  toggleStatus: (
    commentId: string,
    status: "open" | "resolved" | "archived"
  ) => void;
  selectedVideoIds: string[];
  getVideoUrl: (videoId: string) => string;
  onClearSelection: () => void;
  loadingComments: boolean;
  savingComment: boolean;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
};

export function VideoCommentsColumn({
  comments,
  newCommentText,
  setNewCommentText,
  addComment,
  deleteComment,
  toggleStatus,
  selectedVideoIds,
  getVideoUrl,
  onClearSelection,
  loadingComments,
  savingComment,
}: VideoCommentsColumnProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-slate-600" />
          <h3 className="font-bold text-slate-900 text-base">Comments</h3>
          {comments.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              {comments.length}
            </span>
          )}
        </div>
        {selectedVideoIds.length > 0 && (
          <button
            onClick={onClearSelection}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Selected Videos Preview */}
      {selectedVideoIds.length > 0 && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <VideoIcon className="h-4 w-4 text-blue-700" />
            <span className="text-xs font-semibold text-blue-900">
              {selectedVideoIds.length} video
              {selectedVideoIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="text-xs text-blue-700">
            {selectedVideoIds.length} video
            {selectedVideoIds.length > 1 ? "s" : ""} selected for commenting
          </div>
        </div>
      )}

      {/* Comments List */}
      {loadingComments ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-3 mb-4 min-h-[200px] max-h-[600px]">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No comments yet</p>
              <p className="text-xs mt-1">Select videos to add comments</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                  comment.status === "resolved"
                    ? "bg-emerald-50/50 border-emerald-200"
                    : comment.status === "archived"
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header: Avatar - Name - Menu (horizontal) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full ${getAvatarColor(
                        comment.createdBy
                      )} flex items-center justify-center text-white font-bold text-xs shadow-sm`}
                    >
                      {getInitials(comment.createdBy)}
                    </div>

                    {/* Name */}
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {comment.createdBy}
                      </p>
                    </div>
                  </div>

                  {/* Three dots menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === comment.id ? null : comment.id
                        )
                      }
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-500" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === comment.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-xl z-20 min-w-[160px]">
                          {comment.status !== "resolved" && (
                            <button
                              onClick={() => {
                                toggleStatus(comment.id, "resolved");
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 text-emerald-700 font-medium"
                            >
                              <Check className="h-4 w-4" />
                              Mark as resolved
                            </button>
                          )}
                          {comment.status === "resolved" && (
                            <button
                              onClick={() => {
                                toggleStatus(comment.id, "open");
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 text-blue-700 font-medium"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Reopen
                            </button>
                          )}
                          {comment.status !== "archived" && (
                            <button
                              onClick={() => {
                                toggleStatus(comment.id, "archived");
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          )}
                          <div className="border-t border-slate-200" />
                          <button
                            onClick={() => {
                              deleteComment(comment.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-sm text-slate-700 leading-relaxed mb-3 pl-12">
                  {comment.content}
                </p>

                {/* Videos count indicator - EXACTLY like images */}
                {comment.videos && comment.videos.length > 0 && (
                  <div className="pl-12 mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <VideoIcon className="h-3 w-3" />
                      <span>
                        {comment.videos.length} video
                        {comment.videos.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Date Commented + Status Badge */}
                <div className="flex items-center justify-between pl-12 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(comment.createdAt)}
                  </p>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {comment.status === "resolved" && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Resolved
                      </span>
                    )}
                    {comment.status === "archived" && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center gap-1">
                        <Archive className="h-3 w-3" />
                        Archived
                      </span>
                    )}
                  </div>
                </div>

                {/* Resolved by info (if resolved) */}
                {comment.status === "resolved" && comment.resolvedBy && (
                  <div className="mt-2 pl-12 pt-2 border-t border-emerald-100">
                    <p className="text-xs text-emerald-600">
                      Resolved by{" "}
                      <span className="font-semibold">
                        {comment.resolvedBy}
                      </span>
                      {comment.resolvedAt &&
                        ` • ${formatTimeAgo(comment.resolvedAt)}`}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Comment Form */}
      <div className="border-t-2 border-slate-200 pt-4">
        {selectedVideoIds.length > 0 && (
          <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-xs font-semibold text-emerald-700">
              Commenting on {selectedVideoIds.length} video
              {selectedVideoIds.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        <textarea
          className="w-full border-2 border-slate-200 rounded-lg p-3 min-h-[80px] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
          placeholder={
            selectedVideoIds.length > 0
              ? "Write a comment..."
              : "Select videos first"
          }
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          disabled={selectedVideoIds.length === 0 || savingComment}
        />

        <button
          className={`w-full mt-3 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
            selectedVideoIds.length > 0 && !savingComment
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
          onClick={() => addComment(newCommentText)}
          disabled={
            selectedVideoIds.length === 0 ||
            !newCommentText.trim() ||
            savingComment
          }
        >
          {savingComment ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              {selectedVideoIds.length > 0 ? "Post Comment" : "Select Videos"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
