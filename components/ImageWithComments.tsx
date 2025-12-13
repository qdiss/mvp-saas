// ============================================
// REACT COMPONENT: Image with Comments
// components/ImageWithComments.tsx
// ============================================

"use client";

import { useState } from "react";
import { MessageSquare, Check, User, Calendar } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  xPosition: number;
  yPosition: number;
  status: "open" | "resolved";
  createdBy: string;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
}

export function ImageWithComments({
  imageUrl,
  imageId,
  comparisonId,
  comments = [],
}: {
  imageUrl: string;
  imageId: string;
  comparisonId: string;
  comments: Comment[];
}) {
  const [showComments, setShowComments] = useState(true);
  const [newComment, setNewComment] = useState<{ x: number; y: number } | null>(
    null
  );
  const [commentText, setCommentText] = useState("");
  const [assignTo, setAssignTo] = useState("");

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewComment({ x, y });
  };

  const handleSaveComment = async () => {
    if (!newComment || !commentText) return;

    try {
      await fetch("/api/comments/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          comparisonId,
          content: commentText,
          xPosition: newComment.x,
          yPosition: newComment.y,
          assignedTo: assignTo || undefined,
        }),
      });

      setNewComment(null);
      setCommentText("");
      setAssignTo("");
      // Refresh comments
    } catch (error) {
      console.error("Failed to save comment:", error);
    }
  };

  return (
    <div className="relative">
      {/* Image Container */}
      <div className="relative cursor-crosshair" onClick={handleImageClick}>
        <img
          src={imageUrl}
          alt="Product"
          className="w-full h-auto rounded-lg"
        />

        {/* Comment Markers */}
        {showComments &&
          comments.map((comment) => (
            <div
              key={comment.id}
              className="absolute w-8 h-8 -ml-4 -mt-4 cursor-pointer group"
              style={{
                left: `${comment.xPosition}%`,
                top: `${comment.yPosition}%`,
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  comment.status === "resolved" ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {comment.status === "resolved" ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Comment Popup */}
              <div className="hidden group-hover:block absolute top-10 left-0 z-10 w-64 p-3 bg-white border rounded-lg shadow-lg">
                <p className="text-sm">{comment.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span>{comment.createdBy}</span>
                  {comment.assignedTo && (
                    <>
                      <span>→</span>
                      <span>{comment.assignedTo}</span>
                    </>
                  )}
                </div>
                {comment.dueDate && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(comment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

        {/* New Comment Form */}
        {newComment && (
          <div
            className="absolute w-64 p-4 bg-white border rounded-lg shadow-lg z-20"
            style={{
              left: `${newComment.x}%`,
              top: `${newComment.y}%`,
            }}
          >
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded mb-2"
              rows={3}
              autoFocus
            />
            <input
              type="text"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              placeholder="Assign to (optional)"
              className="w-full p-2 border rounded mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveComment}
                className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setNewComment(null)}
                className="flex-1 px-3 py-1 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Comments */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="mt-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
      >
        {showComments ? "Hide" : "Show"} Comments ({comments.length})
      </button>
    </div>
  );
}
