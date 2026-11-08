import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import coreAsset from '@/assets/video-tools/core.wasm.asset.json';

export const DEEPFAKE_LABEL = 'DEEPFAKE | AI GENERATED | FICTIONAL EXERCISE';
export async function stampBoardVideo(url: string): Promise<string> {
  const ffmpeg = new FFmpeg();
  try {
    await ffmpeg.load({ classWorkerURL: '/video-tools/worker/worker.js', coreURL: await toBlobURL('/video-tools/ffmpeg-core.js', 'text/javascript'), wasmURL: await toBlobURL(coreAsset.url, 'application/wasm') });
    const canvas = document.createElement('canvas'); canvas.width = 340; canvas.height = 66;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Video watermark could not be drawn.');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; ctx.fillRect(0, 0, 340, 66);
    ctx.fillStyle = '#ffffff'; ctx.font = '600 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('DEEPFAKE · AI GENERATED', 12, 27);
    ctx.font = '16px sans-serif'; ctx.fillText('FICTIONAL EXERCISE', 12, 51);
    await ffmpeg.writeFile('source.mp4', await fetchFile(url));
    await ffmpeg.writeFile('label.png', await fetchFile(canvas.toDataURL('image/png')));
    const code = await ffmpeg.exec(['-i', 'source.mp4', '-i', 'label.png', '-filter_complex', '[0:v]scale=1280:-2[v];[v][1:v]overlay=W-w-20:20[out]', '-map', '[out]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'copy', '-movflags', '+faststart', 'stamped.mp4']);
    if (code !== 0) throw new Error('Permanent watermark processing failed. Clip cannot be sent.');
    const output = await ffmpeg.readFile('stamped.mp4');
    if (!(output instanceof Uint8Array)) throw new Error('No watermarked video returned.');
    const blob = new Blob([new Uint8Array(output).buffer], { type: 'video/mp4' });
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob); });
  } finally { ffmpeg.terminate(); }
}