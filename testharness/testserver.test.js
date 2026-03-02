// THIS IS WHERE WE WILL GENERATE TEST CODE FOR SERVER.ts
// mock external functions
jest.mock("../imagekit", () => ({
  __esModule: true,
  getAuthParams: jest.fn(() => ({
    token: "mock-token",
    expire: 123,
    signature: "mock-signature",
    publicKey: "fake-public",
    urlEndpoint: "https://fake.endpoint"
  })),
  uploadBuffer: jest.fn(async () => ({
    url: "https://mock.url/upload.jpg",
    fileId: "mock-file-id"
  })),
  toFile: jest.fn(async () => "mock-uploadable")
}));
//mock middleware
jest.mock("fs", () => ({ 
    createReadStream: jest.fn(() => ({ 
        on: jest.fn(), pipe: jest.fn() 
    })) 
}));

const imagekit = require("../imagekit");
const request = require("supertest");
const app = require("../server").default;

process.env.VITE_IMAGEKIT_PRIVATE_KEY = "fake-private";
process.env.VITE_IMAGEKIT_PUBLIC_KEY = "fake-public";
process.env.VITE_IMAGEKIT_URL_ENDPOINT = "https://fake.endpoint";

// test GET imagekit
describe("GET /api/imagekit/auth", () => {
    test("returns auth params", async () => {
        const res= await request(app).get('/api/imagekit/auth');

        expect(res.statusCode).toBe(200); 
        expect(res.body).toEqual({ 
            token: "mock-token", 
            expire: 123, 
            signature: "mock-signature", 
            publicKey: "fake-public", 
            urlEndpoint: "https://fake.endpoint" 
        });
    });
});

// test POST imagekit
describe("POST /api/imagekit/upload-base64", () => {
    // test success response
    test("returns 201", async () => {
        const res = await request(app)
        .post("/api/imagekit/upload-base64") 
        .send({ base64: Buffer.from("test").toString("base64"), fileName: "test.jpg" }); 
        
        expect(res.statusCode).toBe(201); 
        expect(res.body).toEqual({ url: "https://mock.url/upload.jpg", fileId: "mock-file-id" });
    });

    // test error response: Missing Base64
    test("returns 400 when base64 missing", async () => {
        const res = await request(app).post('/api/imagekit/upload-base64');

        expect(res.statusCode).toBe(400);
        expect(res.body).toEqual({ error: "base64 is required" });
    });

    // test error response: Upload Failed
    test("should return 500", async () => {
        imagekit.uploadBuffer.mockRejectedValue(new Error("Upload failed"));
        const res = await request(app)
        .post("/api/imagekit/upload-base64") 
        .send({ base64: Buffer.from("test").toString("base64"), fileName: "test.jpg" }); 
        
        expect(res.statusCode).toBe(500); 
        expect(res.body).toEqual({ error: "Upload failed" });
    })
});

// test non-API routes
describe("get non-api routes", () => {
    // test success response
    test("returns index.html for non-api paths", async () => {
        const res = await request(app).get("/profile");

        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toMatch(/html/);
    });

    // test error response
    test("should return 404", async () => {
        const res = await request(app).get("/api/something");

        expect(res.statusCode).toBe(404);
    });
});

