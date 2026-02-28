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
Describe here:  

    `app.get(/^\/(?!api).*/, (req, res) => {
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
        res.sendFile(path.join(distDir, 'index.html'));
    });`

#### app.listen() for establishing PORT
Describe here:  

    `app.listen(process.env.PORT || 3001, () => {
        console.log(`ImageKit auth server listening on ${process.env.PORT}`);
    });`

## imagekit.ts  
This file defines the getAuthParams() and upload fuctions for users to be able to upload images on the application to be stored in the ImageKit storage cloud.  

#### getAuthParams() [line 18] 
Describe here:  

    `code here`

#### uploadBuffer() [line 29]
Describe here:  

    `code here`

#### uploadFilePath() [line 65]
Describe here:  

    `code here`

#### buildImageUrl() [line 95]
Describe here:  

    `code here`

## Litera.session.sql
This file opens a connection to the MySQL database for our project. We set this up by using the VS Code extension, **SQLTools**. This connection allows us to directly share the MySQL database between group members, and can be activated by typing in the DB password. It allows each member to write SQL queries from VSCode.  

Our group is working on adding database connection routes to `server.ts`.

# TestHarness
To test our code, we created a file called `testharness.test.js` in the folder `tests`. As we are largely using vanilla JavaScript on VS Code, we installed Jest to run our test cases by running the following code in CMD:  

    `npm install jest --save-dev`

Then we added the jest script dependency in `package.json` under `scripts`.

## How to Run TestHarness
Describe here  

example code:  

    `Include example test here`