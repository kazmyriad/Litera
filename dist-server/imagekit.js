"use strict";
//this file handles the connection between ImageKit on the Server-Side (RENDER)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthParams = getAuthParams;
exports.uploadBuffer = uploadBuffer;
exports.uploadFilePath = uploadFilePath;
exports.buildImageUrl = buildImageUrl;
const nodejs_1 = __importStar(require("@imagekit/nodejs"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = require("node:fs");
dotenv_1.default.config();
function ensureEnv() {
    if (!process.env.VITE_IMAGEKIT_PRIVATE_KEY)
        throw new Error("Missing IMAGEKIT_PRIVATE_KEY");
    if (!process.env.VITE_IMAGEKIT_PUBLIC_KEY)
        throw new Error("Missing IMAGEKIT_PUBLIC_KEY");
    if (!process.env.VITE_IMAGEKIT_URL_ENDPOINT)
        throw new Error("Missing IMAGEKIT_URL_ENDPOINT");
}
function getAuthParams() {
    ensureEnv();
    // initialize the NODE SDK client (server-side only)
    const ik = new nodejs_1.default({
        privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
    });
    const { token, expire, signature } = ik.helper.getAuthenticationParameters();
    return {
        token,
        expire,
        signature,
        publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
    };
}
async function uploadBuffer(file, options) {
    ensureEnv();
    const ik = new nodejs_1.default({
        privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
    });
    const uploadable = await (0, nodejs_1.toFile)(file, options?.fileName ?? `upload-${Date.now()}`);
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
        thumbnailUrl: resp.thumbnailUrl ?? null,
        height: resp.height,
        width: resp.width,
        size: resp.size,
        mime: resp.mime,
        name: resp.name,
    };
}
// upload filepath
async function uploadFilePath(pathOnDisk, options) {
    ensureEnv();
    const ik = new nodejs_1.default({
        privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
    });
    const resp = await ik.files.upload({
        file: (0, node_fs_1.createReadStream)(pathOnDisk),
        fileName: options?.fileName ?? `upload-${Date.now()}`,
        folder: options?.folder,
        useUniqueFileName: options?.useUniqueFileName ?? true,
        tags: options?.tags,
    });
    return {
        url: resp.url,
        fileId: resp.fileId,
        filePath: resp.filePath,
        thumbnailUrl: resp.thumbnailUrl ?? null,
        height: resp.height,
        width: resp.width,
        size: resp.size,
        mime: resp.mime,
        name: resp.name,
    };
}
function buildImageUrl(path, transformation) {
    ensureEnv();
    const ik = new nodejs_1.default({
        privateKey: process.env.VITE_IMAGEKIT_PRIVATE_KEY,
    });
    const tr = [];
    if (transformation?.width)
        tr.push({ width: transformation.width });
    if (transformation?.height)
        tr.push({ height: transformation.height });
    if (transformation?.crop)
        tr.push({ crop: transformation.crop });
    if (transformation?.focus)
        tr.push({ focus: transformation.focus });
    if (transformation?.format)
        tr.push({ format: transformation.format });
    if (typeof transformation?.quality === 'number')
        tr.push({ quality: transformation.quality });
    const url = ik.helper.buildSrc({
        urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT,
        src: path.startsWith('http') ? path : `/${path.replace(/^\//, '')}`,
        transformation: tr.length ? tr : undefined,
    });
    return url;
}
