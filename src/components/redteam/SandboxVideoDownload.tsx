import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function SandboxVideoDownload({ url, storagePath, filename }: { url?: string; storagePath?: string | null; filename: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setFile(null); setError(false);
    async function prepare() {
      let source = url;
      if (!source && storagePath) {
        const { data, error: failure } = await supabase.storage.from('exercise-videos').createSignedUrl(storagePath, 60);
        if (failure || !data) throw new Error('Video unavailable');
        source = data.signedUrl;
      }
      if (!source) return;
      const response = await fetch(source, { signal: controller.signal });
      if (!response.ok) throw new Error('Video unavailable');
      const blob = await response.blob();
      if (!blob.size || (!blob.type.startsWith('video/') && blob.type !== 'application/octet-stream')) throw new Error('Invalid video');
      if (!controller.signal.aborted) setFile(new File([blob], filename, { type: blob.type.startsWith('video/') ? blob.type : 'video/mp4' }));
    }
    void prepare().catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [url, storagePath, filename, attempt]);

  async function download() {
    if (!file) return;
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return; }
      catch (failure) { if (failure instanceof DOMException && failure.name === 'AbortError') return; }
    }
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = objectUrl; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  }
  return <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" size="sm" disabled={!file && !error} onClick={() => error ? setAttempt(value => value + 1) : void download()}>
      {!file && !error ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {error ? 'Retry video download' : file ? 'Download video' : 'Preparing download…'}
    </Button>
    {error && <p role="alert" className="text-xs text-destructive">Video could not be prepared. Please retry.</p>}
  </div>;
}