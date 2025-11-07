'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks/endpoints', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.endpoints || []);
      } else {
        toast.error('Failed to load webhooks');
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast.error('Error loading webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !url.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      const response = await fetch(
        editingWebhook
          ? `/api/webhooks/endpoints/${editingWebhook.id}`
          : '/api/webhooks/endpoints',
        {
          method: editingWebhook ? 'PUT' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            url: url.trim(),
            description: description.trim() || undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success(editingWebhook ? 'Webhook updated!' : 'Webhook created!');
        setIsDialogOpen(false);
        resetForm();
        loadWebhooks();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save webhook');
      }
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Error saving webhook');
    }
  };

  const handleEdit = (webhook: WebhookEndpoint) => {
    setEditingWebhook(webhook);
    setName(webhook.name);
    setUrl(webhook.url);
    setDescription(webhook.description || '');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const response = await fetch(`/api/webhooks/endpoints/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Webhook deleted!');
        loadWebhooks();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete webhook');
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Error deleting webhook');
    }
  };

  const handleToggleActive = async (webhook: WebhookEndpoint) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${webhook.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !webhook.isActive,
        }),
      });

      if (response.ok) {
        toast.success(`Webhook ${!webhook.isActive ? 'activated' : 'deactivated'}!`);
        loadWebhooks();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update webhook');
      }
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Error updating webhook');
    }
  };

  const resetForm = () => {
    setName('');
    setUrl('');
    setDescription('');
    setEditingWebhook(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Webhook Endpoints</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your webhook endpoints for button actions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
              </DialogTitle>
              <DialogDescription>
                Create a webhook endpoint to use in button actions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Telegram Notification"
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.telegram.org/bot..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Full webhook URL including tokens and parameters
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWebhook ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No webhooks configured yet</p>
              <p className="text-sm text-gray-400">
                Click &quot;Add Webhook&quot; to create your first webhook endpoint
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{webhook.name}</CardTitle>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {webhook.description && (
                      <CardDescription className="mt-1">
                        {webhook.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Endpoint URL
                    </p>
                    <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 break-all">
                      {webhook.url}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(webhook)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(webhook)}
                    >
                      {webhook.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(webhook.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
