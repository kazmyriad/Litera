***M02-A03***  

# The Book Club: System Component API Stubs and Automated System Tests

***Alyssa Foran, Hannah Kresefski, Karis Jones, Skyler Koba***  

The code provided in this project currently only includes an API that connects to Render.com (host) and ImageKit, as well as our MySQL database. Our group plans to add another API connection to GetStream.io to enable chat features. Additionally, some connections are still a work in progress, such as the MySQL connection.

## API Methods
### server.ts  
This file handles routes to the server-side. It includes all necessary API routing methods to Render.com, ImageKit, and will later also hold routes to MySQL and GetStream.io.  

#### app.get() for ImageKit [line 13]
This method creates a request to connect to the ImageKit storage cloud by calling authentication information:  

    `app.get('/api/imagekit/auth', (_req, res) => {
        res.json(getAuthParams());
    });`  

#### app.post() for ImageKit [line 17]
This method handles image upload requests to the ImageKit storage cloud. This includes try-catch statements for error handling:
    
    `app.post('/api/imagekit/upload-base64', async (req, res) => {
        const { base64, fileName, folder } = req.body as { base64: string; fileName?: string; folder?: string };
        if (!base64) return res.status(400).json({ error: 'base64 is required' });

        const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
        const buffer = Buffer.from(b64, 'base64');

        try {
            const result = await uploadBuffer(buffer, {fileName, folder});
            res.status(201).json(result);
        } catch (e) {
            console.error('[IK] upload failed:', e);
            res.status(500).json({ error: 'Upload failed' });
        }
    });`

#### app.get() for Render.com API connection [line 37]
This method requests the client-side connection to the host server, Render.com, by joining the path on the main html file in the project: 

    `app.get(/^\/(?!api).*/, (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
        res.sendFile(path.join(distDir, 'index.html'));
    });`

## imagekit.ts  
This file defines the getAuthParams() and upload fuctions for users to be able to upload images on the application to be stored in the ImageKit storage cloud.  

#### getAuthParams() [line 18] 
This method fetches the necessary authentication information from `.env.local` or `.env.production` to connect to ImageKit:

    `export function getAuthParams() {
        const { token, expire, signature } = ik.helper.getAuthenticationParameters();
        return {
            token,
            expire,
            signature,
            publicKey: PUBLIC_KEY!,
            urlEndpoint: URL_ENDPOINT!,
        };
    }`

#### uploadBuffer() [line 29]
This method handles user uploads from the application to ImageKit. It defines file information and reformats it to be stored directly on ImageKit:  

    `export async function uploadBuffer(
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
    }`

#### uploadFilePath() [line 65]
This method grabs the users local file path to be reformated and uploaded to a temporary storage file for scalability:

    `export async function uploadFilePath(
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
    }`

#### buildImageUrl() [line 95]
This method builds the file url that will be returned to the application when the image is referenced from ImageKit:  

    `export function buildImageUrl(
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
    }`

## Litera.session.sql
This file opens a connection to the MySQL database for our project. We set this up by using the VS Code extension, **SQLTools**. This connection allows us to directly share the MySQL database between group members, and can be activated by typing in the DB password. It allows each member to write SQL queries from VSCode.  

Our group is working on adding database connection routes to `server.ts`.

# TestHarness
To test our code, we created files called `testserver.test.js` and `testimagekit.test.js` in the folder `testharness`. As we are largely using vanilla JavaScript on VS Code, we installed Jest to run our test cases by running the following code in CMD:  

    `npm install --save-dev ts-jest @types/jest
    npx ts-jest config:init
    npm install dotenv
    `

Then we added the jest script dependency in `package.json` under `scripts`.

## How to Run TestHarness
Describe here  

example code:  

    `Include example test here`