//this file handles the connection between ImageKit on the Server-Side (RENDER)

import ImageKit, { toFile, type Uploadable }from '@imagekit/nodejs';

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;
const URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT;

if (!PRIVATE_KEY) throw new Error('Missing IMAGEKIT_PRIVATE_KEY');
if (!URL_ENDPOINT) throw new Error('Missing IMAGEKIT_URL_ENDPOINT');
if (!PUBLIC_KEY) throw new Error('Missing IMAGEKIT_PUBLIC_KEY');

// Initialize the Node SDK client (server-side only)
const ik = new ImageKit({
  privateKey: PRIVATE_KEY,
});

export function getAuthParams() {
  const { token, expire, signature } = ik.helper.getAuthenticationParameters();
  return {
    token,
    expire,
    signature,
    publicKey: PUBLIC_KEY!,
    urlEndpoint: URL_ENDPOINT!,
  };
}

export async function uploadBuffer(
  file: Buffer | Uint8Array,
  options?: {
    fileName?: string;
    folder?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
  }
) {
  const uploadable: Uploadable = await toFile(
    file,
    options?.fileName ?? `upload-${Date.now()}`
  );

  const resp = await ik.files.upload({
    file: uploadable,
    fileName: options?.fileName ?? `upload-${Date.now()}`,
    folder: options?.folder,
    useUniqueFileName: options?.useUniqueFileName ?? true,
    tags: options?.tags,
  });

  return {
    url: resp.url,
    fileId: resp.fileId,
    filePath: resp.filePath,
    thumbnailUrl: (resp as any).thumbnailUrl ?? null,
    height: (resp as any).height,
    width: (resp as any).width,
    size: (resp as any).size,
    mime: (resp as any).mime,
    name: (resp as any).name,
  };
}

// upload filepath
export async function uploadFilePath(
  pathOnDisk: string,
  options?: {
    fileName?: string;
    folder?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
  }
) {
  const resp = await ik.files.upload({
    file: await import('fs').then((m) => m.createReadStream(pathOnDisk)),
    fileName: options?.fileName ?? `upload-${Date.now()}`,
    folder: options?.folder,
    useUniqueFileName: options?.useUniqueFileName ?? true,
    tags: options?.tags,
  });

  return {
    url: resp.url,
    fileId: resp.fileId,
    filePath: resp.filePath,
    thumbnailUrl: (resp as any).thumbnailUrl ?? null,
    height: (resp as any).height,
    width: (resp as any).width,
    size: (resp as any).size,
    mime: (resp as any).mime,
    name: (resp as any).name,
  };
}

export function buildImageUrl(
  path: string,
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'maintain_ratio' | 'force' | 'at_least' | 'extract';
    focus?: 'auto' | 'face' | 'center';
    format?: 'webp' | 'jpg' | 'png' | 'avif';
    quality?: number;
  }
) {
  const tr: any[] = [];
  if (transformation?.width) tr.push({ width: transformation.width });
  if (transformation?.height) tr.push({ height: transformation.height });
  if (transformation?.crop) tr.push({ crop: transformation.crop });
  if (transformation?.focus) tr.push({ focus: transformation.focus });
  if (transformation?.format) tr.push({ format: transformation.format });
  if (typeof transformation?.quality === 'number') tr.push({ quality: transformation.quality });

  const url = ik.helper.buildSrc({
    urlEndpoint: URL_ENDPOINT!,
    src: path.startsWith('http') ? path : `/${path.replace(/^\//, '')}`,
    transformation: tr.length ? tr : undefined,
  });

  return url;
}