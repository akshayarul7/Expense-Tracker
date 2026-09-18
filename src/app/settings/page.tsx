'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { backupToDrive, restoreFromDrive, getBackupMetadata } from '@/lib/drive-sync';
import { supabase } from '@/lib/supabase';

import { format } from 'date-fns';
import { HardDrive, UploadCloud, DownloadCloud, AlertCircle } from 'lucide-react';
import Script from 'next/script';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const saved = localStorage.getItem('last_drive_backup');
    if (saved) setLastBackup(saved);
  }, []);

    const handleBackup = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsBackingUp(true);
      await backupToDrive();
      
      const newMeta = await getBackupMetadata();
      const timeToSave = newMeta || new Date().toISOString();
      setLastBackup(timeToSave);
      localStorage.setItem('last_drive_backup', timeToSave);
      
      setSuccess('Successfully backed up to Google Drive!');
    } catch (e: any) {
      setError(e.message || 'Failed to backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    
    try {
      setError(null);
      setSuccess(null);
      setIsRestoring(true);
      const res = await restoreFromDrive();
      
      const newMeta = await getBackupMetadata();
      if (newMeta) {
        setLastBackup(newMeta);
        localStorage.setItem('last_drive_backup', newMeta);
      }
      
      setSuccess(`Successfully restored ${res.expenses} expenses and ${res.budgets} budgets!`);
    } catch (e: any) {
      setError(e.message || 'Failed to restore.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your app data and backups.</p>
      </div>

      {!hasClientId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Google Client ID</AlertTitle>
          <AlertDescription>
            To use Google Drive Backup, you need to create an OAuth Client ID on the Google Cloud Console and add it to your <code>.env.local</code> file as <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/15 text-green-600 border-green-500/50">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

            

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Cloud Backup
          </CardTitle>
          <CardDescription>
            Securely back up your entire database to a hidden, app-specific folder in your personal Google Drive. 
            Because it uses the AppData folder, it won't clutter your main Drive files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Last Backup: </span>
            {lastBackup ? format(new Date(lastBackup), 'PPpp') : 'Unknown (or never)'}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-4 border-t px-6 py-4 bg-muted/50">
          <Button 
            onClick={handleBackup} 
            disabled={!hasClientId || isBackingUp || isRestoring}
            className="w-full sm:w-auto"
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            {isBackingUp ? 'Backing up...' : 'Backup Now'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleRestore} 
            disabled={!hasClientId || isRestoring || isBackingUp}
            className="w-full sm:w-auto"
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            {isRestoring ? 'Restoring...' : 'Restore from Cloud'}
          </Button>
          <Button 
            variant="secondary"
            onClick={async () => {
              try {
                const { downloadRawBackupFromDrive } = await import('@/lib/drive-sync');
                const jsonStr = await downloadRawBackupFromDrive();
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cloud-backup-verification.json';
                a.click();
                URL.revokeObjectURL(url);
              } catch (e: any) {
                setError(e.message || 'Failed to download.');
              }
            }} 
            disabled={!hasClientId}
            className="w-full sm:w-auto"
          >
            Download Cloud Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
