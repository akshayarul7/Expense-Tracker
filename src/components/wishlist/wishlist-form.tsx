'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WishlistItem } from '@/lib/db';
import { addWishlistItem, updateWishlistItem } from '@/lib/db-helpers';

interface WishlistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: WishlistItem | null;
}

export function WishlistForm({ open, onOpenChange, onSuccess, initialData }: WishlistFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setName(initialData.name);
      setPrice(initialData.price.toString());
      setUrl(initialData.url || '');
      setImageUrl(initialData.imageUrl || '');
    } else if (open) {
      setName('');
      setPrice('');
      setUrl('');
      setImageUrl('');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsLoading(true);
    try {
      const itemData = {
        name,
        price: parseFloat(price),
        url: url || undefined,
        imageUrl: imageUrl || undefined,
        status: initialData?.status || 'want',
      } as Omit<WishlistItem, 'id' | 'createdAt'>;

      if (initialData?.id) {
        await updateWishlistItem(initialData.id, itemData);
      } else {
        await addWishlistItem(itemData);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save wishlist item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Wishlist Item' : 'Add to Wishlist'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              placeholder="e.g. MacBook Pro M4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Buy Link (optional)</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://amazon.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {imageUrl && (
            <div className="mt-4 flex justify-center">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-h-32 rounded-md object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
