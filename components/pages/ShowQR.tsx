'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateQRCode } from '@/lib/utils/qrcode';
import { QrCode, Download, Clock, AlertTriangle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

  // Generate QR code every time the Sheet opens
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <QrCode className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Show QR Code</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{pageTitle}</SheetTitle>
          <SheetDescription>
            Scan the QR code to view this page
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Timer banner */}
          {hasExpiry && expiresAt && timeRemaining > 0 && (
            <Alert className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none">
              <Clock className="h-4 w-4 text-white" />
              <AlertDescription className="text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Time Remaining:</span>
                    <span className="text-xl font-bold font-mono">
                      {formattedTime}
                    </span>
                  </div>
                  <span className="text-xs opacity-90">Auto-expires</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code content */}
          <div className="flex flex-col items-center justify-center space-y-6">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-64 w-64" />
                <p className="text-muted-foreground">Generating QR code...</p>
              </div>
            ) : qrCodeData ? (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={qrCodeData}
                    alt="QR Code"
                    className="border-2 border-border rounded-lg p-4 bg-background shadow-sm"
                  />

                  <div className="text-center space-y-2 max-w-sm">
                    {hasExpiry && timeRemaining === 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This link has expired
                        </AlertDescription>
                      </Alert>
                    )}

                    {hasExpiry && timeRemaining > 0 && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          This link has a time limit
                        </AlertDescription>
                      </Alert>
                    )}

                    <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded break-all">
                      {accessUrl.replace(window.location.origin, '')}
                    </p>
                  </div>

                  <Button onClick={handleDownload} className="w-full max-w-sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Failed to generate QR code</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
