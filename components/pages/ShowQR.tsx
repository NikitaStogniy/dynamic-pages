'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { generateQRCode } from '@/lib/utils/qrcode';
import {QrCode} from "lucide-react";

interface ShowQRProps {
  pageSlug: string;
  pageTitle: string;
}

export default function ShowQR({ pageSlug, pageTitle }: ShowQRProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string>('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Memoize formatted time to avoid recalculating on every render
  const formattedTime = useMemo(() => {
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [timeRemaining]);

  const generateQR = useCallback(async () => {
    setLoading(true);
    try {
      // Try to generate an access token
      const tokenResponse = await fetch(`/api/pages/${pageSlug}/access-token`, {
        method: 'POST',
        credentials: 'include',
      });

      let pageUrl = `${window.location.origin}/p/${pageSlug}`;
      let useExpiry = false;
      let tokenExpiresAt: Date | null = null;

      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        if (data.token) {
          // If token exists, use access URL
          pageUrl = `${window.location.origin}/access/${data.token}`;
          useExpiry = true;
          tokenExpiresAt = new Date(data.expiresAt);
        }
      }

      setAccessUrl(pageUrl);
      setHasExpiry(useExpiry);
      setExpiresAt(tokenExpiresAt);

      const qrCode = await generateQRCode(pageUrl);
      setQrCodeData(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSlug]);

  // Memoize download handler
  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.download = `qr-${pageSlug}.png`;
    link.href = qrCodeData;
    link.click();
  }, [pageSlug, qrCodeData]);

  // Generate QR code every time the BottomSheet opens
  useEffect(() => {
    if (isOpen) {
      generateQR();
    } else {
      // Reset state when closing
      setQrCodeData('');
      setExpiresAt(null);
      setTimeRemaining(0);
    }
  }, [isOpen, generateQR]);

  // Timer countdown effect
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining(0);
        return;
      }

      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 px-3 py-1 text-sm font-medium transition-all cursor-pointer"
      >
          <QrCode />
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`QR Code - ${pageTitle}`}
      >
        <div className="flex flex-col">
          {/* Timer banner */}
          {hasExpiry && expiresAt && timeRemaining > 0 && (
            <div className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 mb-4 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">⏱️ Time Remaining:</span>
                  <span className="text-xl font-bold font-mono">
                    {formattedTime}
                  </span>
                </div>
                <div className="text-xs opacity-90">
                  Auto-expires
                </div>
              </div>
            </div>
          )}

          {/* QR Code content */}
          <div className="flex flex-col items-center justify-center py-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Generating QR code...</div>
              </div>
            ) : qrCodeData ? (
              <div className="flex flex-col items-center space-y-4">
                <img
                  src={qrCodeData}
                  alt="QR Code"
                  className="border-2 border-gray-200 rounded-lg p-4 bg-white"
                />
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scan this QR code to view the page
                  </p>
                  {hasExpiry && timeRemaining === 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      ⚠️ This link has expired
                    </p>
                  )}
                  {hasExpiry && timeRemaining > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      ⏱️ This link has a time limit
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded break-all">
                    {accessUrl.replace(window.location.origin, '')}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Download QR Code
                </button>
              </div>
            ) : (
              <div className="text-red-500">Failed to generate QR code</div>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
