'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen && !qrCodeData) {
      generateQR();
    }
  }, [isOpen]);

  const generateQR = async () => {
    setLoading(true);
    try {
      // First, try to generate an access token
      const tokenResponse = await fetch(`/api/pages/${pageSlug}/access-token`, {
        method: 'POST',
        credentials: 'include',
      });

      let pageUrl = `${window.location.origin}/p/${pageSlug}`;
      let useExpiry = false;

      if (tokenResponse.ok) {
        const data = await tokenResponse.json();
        if (data.token) {
          // If token exists, use access URL
          pageUrl = `${window.location.origin}/access/${data.token}`;
          useExpiry = true;
        }
      }

      setAccessUrl(pageUrl);
      setHasExpiry(useExpiry);
      const qrCode = await generateQRCode(pageUrl);
      setQrCodeData(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

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
                {hasExpiry && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    ⏱️ This link has a time limit
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded break-all">
                  {accessUrl.replace(window.location.origin, '')}
                </p>
              </div>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = `qr-${pageSlug}.png`;
                  link.href = qrCodeData;
                  link.click();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Download QR Code
              </button>
            </div>
          ) : (
            <div className="text-red-500">Failed to generate QR code</div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}