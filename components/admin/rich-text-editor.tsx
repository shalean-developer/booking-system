'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Image as ImageIcon, 
  Type, 
  Heading1, 
  Heading2, 
  Heading3,
  Upload,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Write your blog post content here..." }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const insertHeading = (level: number) => {
    const before = `<h${level}>`;
    const after = `</h${level}>`;
    insertText(before, after);
  };

  const insertBold = () => {
    insertText('<strong>', '</strong>');
  };

  const insertItalic = () => {
    insertText('<em>', '</em>');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      insertText(`<a href="${url}">`, '</a>');
    }
  };

  const insertList = (ordered: boolean = false) => {
    const tag = ordered ? 'ol' : 'ul';
    const before = `<${tag}>\n<li>`;
    const after = `</li>\n</${tag}>`;
    insertText(before, after);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF files are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/blog/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      const imageHtml = `<img src="${result.imageUrl}" alt="" class="rounded-lg shadow-md my-4" />`;
      insertText(imageHtml);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const insertTipCard = (type: 'tip' | 'pro' | 'bonus' | 'warning') => {
    const classMap = {
      tip: 'tip-card',
      pro: 'pro-tip',
      bonus: 'bonus-tip',
      warning: 'warning-tip'
    };

    const before = `<div class="${classMap[type]}">\n<p><strong>`;
    const after = `</strong></p>\n</div>`;
    insertText(before, after);
  };

  const insertNumberedTip = () => {
    const before = `<div class="numbered-tip">\n<div class="flex items-start gap-4">\n<div class="tip-number">1</div>\n<div class="tip-content">\n<h3>`;
    const after = `</h3>\n<p>Description here...</p>\n</div>\n</div>\n</div>`;
    insertText(before, after);
  };

  const formatContent = (content: string) => {
    // Simple HTML formatting for preview
    return content
      .replace(/<h1>/g, '<h1 class="text-4xl font-bold text-gray-900 mb-4 mt-8">')
      .replace(/<h2>/g, '<h2 class="text-3xl font-bold text-gray-900 mb-3 mt-6">')
      .replace(/<h3>/g, '<h3 class="text-2xl font-semibold text-gray-900 mb-2 mt-4">')
      .replace(/<p>/g, '<p class="mb-4">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
      .replace(/<li>/g, '<li class="mb-1">')
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<em>/g, '<em class="italic">');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 border border-gray-300 rounded-lg bg-gray-50">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeading(1)}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeading(2)}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertHeading(3)}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Text Styling */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertBold}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertItalic}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={insertLink}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertList(false)}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertList(true)}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Media */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              title="Upload Image"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-pulse" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Special Cards */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTipCard('pro')}
            title="Pro Tip"
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            Pro
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTipCard('bonus')}
            title="Bonus Tip"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Bonus
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertNumberedTip()}
            title="Numbered Tip"
          >
            Tip #
          </Button>
        </div>

        {/* Preview Toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          title="Toggle Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor/Preview */}
      {isPreview ? (
        <div className="min-h-[300px] p-4 border border-gray-300 rounded-lg bg-white">
          <div className="text-sm text-gray-500 mb-4">Preview:</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-md font-mono text-sm resize-vertical"
        />
      )}

      {/* Quick Help */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <strong>Quick Tips:</strong> Use the toolbar buttons to format text. For images, click the image icon to upload. 
        Use Pro/Bonus buttons for highlighted tips. Switch to preview mode to see how your content will look.
      </div>
    </div>
  );
}
