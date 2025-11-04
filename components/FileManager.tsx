'use client';

import { useState, useEffect } from 'react';
import { Trash2, Image, FileText, Download } from 'lucide-react';

interface UploadcareFile {
  id: number;
  fileId: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<UploadcareFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/upload', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="w-4 h-4" />;
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="p-4">Loading files...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No files uploaded yet</p>
        <p className="text-sm mt-2">Upload images through the editor to see them here</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              {getFileIcon(file.mimeType)}
              <div>
                <p className="font-medium text-sm">
                  {file.fileName || 'Unnamed file'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded"
                title="View file"
              >
                <Download className="w-4 h-4" />
              </a>
              {file.mimeType?.startsWith('image/') && (
                <img
                  src={file.fileUrl}
                  alt={file.fileName || 'Image'}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">Uploadcare Integration Active</h3>
        <p className="text-xs text-gray-600">
          Images are now stored on Uploadcare CDN for better performance and scalability.
          Your existing base64 images will continue to work.
        </p>
      </div>
    </div>
  );
}