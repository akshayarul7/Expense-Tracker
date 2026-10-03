'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Gift, ExternalLink, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { getWishlistItems, deleteWishlistItem, updateWishlistItem } from '@/lib/db-helpers';
import { WishlistItem } from '@/lib/db';
import { WishlistForm } from '@/components/wishlist/wishlist-form';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<WishlistItem | null>(null);

  const fetchItems = async () => {
    try {
      const data = await getWishlistItems();
      setItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete?.id) return;
    try {
      await deleteWishlistItem(itemToDelete.id);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleMarkBought = async (item: WishlistItem) => {
    if (!item.id) return;
    try {
      const newStatus = item.status === 'want' ? 'bought' : 'want';
      await updateWishlistItem(item.id, { status: newStatus });
      fetchItems();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const totalCost = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {!isLoading && items.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Total value of your wishlist: <span className="font-semibold text-foreground">${totalCost.toFixed(2)}</span>
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardHeader><div className="h-6 bg-muted rounded w-2/3" /></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Gift className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Add items you're saving up for. Keeping track of them here helps you stay focused on your goals!
          </p>
          <Button onClick={handleAddNew}>Add your first item</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className={`flex flex-col overflow-hidden transition-all ${item.status === 'bought' ? 'opacity-75 bg-muted/50' : ''}`}>
              {/* Image Section */}
              <div className="relative h-48 bg-muted flex items-center justify-center border-b">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Gift className={`h-12 w-12 text-muted-foreground/30 absolute ${item.imageUrl ? 'hidden' : ''}`} />
                
                {item.status === 'bought' && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-[2px]">
                    <Badge variant="secondary" className="text-sm px-3 py-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Purchased
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1" title={item.name}>{item.name}</CardTitle>
                <div className="text-xl font-bold">${item.price.toFixed(2)}</div>
              </CardHeader>
              
              <CardContent className="flex-1">
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center hover:underline"
                  >
                    View Product <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4 bg-muted/20">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleMarkBought(item)}
                  className={item.status === 'bought' ? 'text-green-600' : ''}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {item.status === 'bought' ? 'Mark as Unbought' : 'Mark Bought'}
                </Button>
                
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setItemToDelete(item)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Add Form */}
      <WishlistForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSuccess={fetchItems}
        initialData={editingItem}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete wishlist item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
