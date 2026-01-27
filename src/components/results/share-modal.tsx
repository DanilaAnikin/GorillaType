'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Download, Copy, Twitter, Check, Info } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import { ResultCard } from './result-card';
import type { TestResult } from '@/store/results-store';

// Type for html2canvas - optional dependency
type Html2CanvasType = (
  element: HTMLElement,
  options?: {
    backgroundColor?: string | null;
    scale?: number;
    logging?: boolean;
    useCORS?: boolean;
  }
) => Promise<HTMLCanvasElement>;

// Cache html2canvas module once loaded
let html2canvasModule: { default: Html2CanvasType } | null = null;
let html2canvasChecked = false;
let html2canvasAvailable = false;

/**
 * Try to dynamically load html2canvas
 * Returns the module if available, null otherwise
 */
async function loadHtml2Canvas(): Promise<Html2CanvasType | null> {
  if (html2canvasChecked) {
    return html2canvasModule?.default ?? null;
  }

  try {
    // Use Function constructor to completely hide the import from bundler analysis
    // This prevents build-time errors when the package is not installed
    const dynamicImport = new Function(
      'moduleName',
      'return import(moduleName)'
    );
    html2canvasModule = await dynamicImport('html2canvas');
    html2canvasAvailable = true;
    html2canvasChecked = true;
    return html2canvasModule?.default ?? null;
  } catch {
    html2canvasChecked = true;
    html2canvasAvailable = false;
    return null;
  }
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
  username?: string | null;
  avatarUrl?: string | null;
}

/**
 * Generate the share text for social media
 */
function generateShareText(result: TestResult): string {
  return `I just typed ${Math.round(result.wpm)} WPM with ${result.accuracy.toFixed(1)}% accuracy on GorillaType! \u{1F98D}\u{2328}\u{FE0F} #GorillaType`;
}

/**
 * Generate Twitter/X share URL
 */
function generateTwitterShareUrl(text: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent('https://gorillatype.com');
  return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
}

/**
 * ShareModal - Modal for sharing typing test results
 *
 * Features:
 * - Result card preview
 * - Copy as image (requires html2canvas - placeholder for now)
 * - Share to Twitter/X
 * - Download as PNG (requires html2canvas - placeholder for now)
 */
export function ShareModal({
  isOpen,
  onClose,
  result,
  username,
  avatarUrl,
}: ShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isHtml2CanvasAvailable, setIsHtml2CanvasAvailable] = useState<boolean | null>(null);

  const shareText = generateShareText(result);

  // Check if html2canvas is available on mount
  useEffect(() => {
    if (isOpen && isHtml2CanvasAvailable === null) {
      loadHtml2Canvas().then((module) => {
        setIsHtml2CanvasAvailable(module !== null);
      });
    }
  }, [isOpen, isHtml2CanvasAvailable]);

  /**
   * Copy share text to clipboard
   */
  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [shareText]);

  /**
   * Share to Twitter/X
   */
  const handleShareTwitter = useCallback(() => {
    const url = generateTwitterShareUrl(shareText);
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }, [shareText]);

  /**
   * Download as PNG image
   * Note: This requires html2canvas library. The structure is prepared
   * but actual implementation needs the library to be installed.
   */
  const handleDownloadImage = useCallback(async () => {
    if (!cardRef.current) return;

    setIsExporting(true);

    try {
      const html2canvas = await loadHtml2Canvas();

      if (!html2canvas) {
        alert(
          'Image export requires the html2canvas library.\n\n' +
          'Install it with: npm install html2canvas'
        );
        return;
      }

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gorillatype-${Math.round(result.wpm)}wpm-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to export image:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [result.wpm]);

  /**
   * Copy image to clipboard
   * Note: This also requires html2canvas and clipboard API support
   */
  const handleCopyImage = useCallback(async () => {
    if (!cardRef.current) return;

    setIsExporting(true);

    try {
      const html2canvas = await loadHtml2Canvas();

      if (!html2canvas) {
        alert(
          'Image export requires the html2canvas library.\n\n' +
          'Install it with: npm install html2canvas'
        );
        return;
      }

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } catch {
            // Fallback: download instead
            alert(
              'Your browser does not support copying images to clipboard. ' +
              'The image will be downloaded instead.'
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gorillatype-${Math.round(result.wpm)}wpm.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Failed to copy image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [result.wpm]);

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-[680px] bg-bg">
        <ModalHeader>
          <ModalTitle>Share Your Result</ModalTitle>
          <ModalDescription>
            Share your typing achievement with the world
          </ModalDescription>
        </ModalHeader>

        {/* Result Card Preview */}
        <div className="my-6 flex justify-center overflow-auto">
          <div className="scale-[0.85] origin-top transform-gpu">
            <ResultCard
              ref={cardRef}
              result={result}
              username={username}
              avatarUrl={avatarUrl}
            />
          </div>
        </div>

        {/* Share Text Preview */}
        <div className="mb-4 p-3 rounded-lg bg-sub-alt border border-sub/30">
          <p className="text-sm text-text font-mono">{shareText}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Copy Text */}
          <button
            onClick={handleCopyText}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg',
              'bg-sub-alt hover:bg-sub-alt/80 border border-sub/30',
              'text-text transition-all duration-125',
              'hover:border-main/50 hover:text-main',
              'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
            )}
          >
            {copySuccess ? (
              <Check className="h-5 w-5 text-main" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="text-xs font-medium">
              {copySuccess ? 'Copied!' : 'Copy Text'}
            </span>
          </button>

          {/* Share to Twitter */}
          <button
            onClick={handleShareTwitter}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg',
              'bg-sub-alt hover:bg-sub-alt/80 border border-sub/30',
              'text-text transition-all duration-125',
              'hover:border-[#1DA1F2]/50 hover:text-[#1DA1F2]',
              'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
            )}
          >
            <Twitter className="h-5 w-5" />
            <span className="text-xs font-medium">Twitter/X</span>
          </button>

          {/* Copy as Image */}
          <button
            onClick={handleCopyImage}
            disabled={isExporting}
            title={isHtml2CanvasAvailable === false ? 'Requires html2canvas package' : undefined}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg relative',
              'bg-sub-alt hover:bg-sub-alt/80 border border-sub/30',
              'text-text transition-all duration-125',
              'hover:border-main/50 hover:text-main',
              'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isHtml2CanvasAvailable === false && 'opacity-60'
            )}
          >
            {isHtml2CanvasAvailable === false && (
              <Info className="h-3 w-3 absolute top-2 right-2 text-sub" />
            )}
            <Copy className="h-5 w-5" />
            <span className="text-xs font-medium">
              {isExporting ? 'Exporting...' : 'Copy Image'}
            </span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            title={isHtml2CanvasAvailable === false ? 'Requires html2canvas package' : undefined}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg relative',
              'bg-sub-alt hover:bg-sub-alt/80 border border-sub/30',
              'text-text transition-all duration-125',
              'hover:border-main/50 hover:text-main',
              'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isHtml2CanvasAvailable === false && 'opacity-60'
            )}
          >
            {isHtml2CanvasAvailable === false && (
              <Info className="h-3 w-3 absolute top-2 right-2 text-sub" />
            )}
            <Download className="h-5 w-5" />
            <span className="text-xs font-medium">
              {isExporting ? 'Exporting...' : 'Download PNG'}
            </span>
          </button>
        </div>

        {/* Note about image export - only show if html2canvas is not available */}
        {isHtml2CanvasAvailable === false && (
          <p className="mt-4 text-xs text-sub text-center">
            Image export requires the html2canvas library. Install with:{' '}
            <code className="px-1 py-0.5 rounded bg-sub-alt text-text">
              npm install html2canvas
            </code>
          </p>
        )}
      </ModalContent>
    </Modal>
  );
}

export default ShareModal;
