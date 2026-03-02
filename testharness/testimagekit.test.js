// THIS IS WHERE WE WILL GENERATE TEST CODE FOR IMAGEKIT.ts

// mock imagekit
jest.mock("@imagekit/nodejs", () => {
  const ImageKitMock = jest.fn().mockImplementation(() => ({
    helper: {
      getAuthenticationParameters: () => ({
        token: "mock-token",
        expire: 123456,
        signature: "mock-signature",
      }),
      buildSrc: jest.fn().mockReturnValue("https://mock.url/image.jpg"),
    },
    files: {
      upload: jest.fn().mockResolvedValue({
        url: "https://mock.url/upload.jpg",
        fileId: "mock-file-id",
        filePath: "/mock/path",
        height: 100,
        width: 200,
        size: 1234,
        mime: "image/jpeg",
        name: "mock.jpg",
      }),
    },
  }));
  return {
    __esModule: true,
    default: ImageKitMock,
    toFile: jest.fn(async () => "mock-uploadable"),
  };
});

// mock middleware
jest.mock("fs", () => ({ 
    createReadStream: jest.fn(() => ({ 
        on: jest.fn(), pipe: jest.fn() ,
    })), 
}));

process.env.VITE_IMAGEKIT_PRIVATE_KEY = "fake-private";
process.env.VITE_IMAGEKIT_PUBLIC_KEY = "fake-public";
process.env.VITE_IMAGEKIT_URL_ENDPOINT = "https://fake.endpoint";

// module is now a requirement 2 run to avoid dynamic import errs
const { getAuthParams, uploadBuffer, buildImageUrl, uploadFilePath } = require("../imagekit");

// test getAuthParams
describe("getAuthParams", () => {
    test("should return expected auth params", async () => {
        const params = getAuthParams();

        expect(params).toEqual({ 
            token: "mock-token", 
            expire: 123456, 
            signature: "mock-signature", 
            publicKey: "fake-public", 
            urlEndpoint: "https://fake.endpoint", 
        });
    });
});

// test buffer
describe("upload buffer", () => {
    test("uploads buffer and returns transformed response", async () => {
        const buffer = Buffer.from("test"); 
        const result = await uploadBuffer(
            buffer, { fileName: "test.jpg" }
        ); 
        
        expect(result.url).toBe("https://mock.url/upload.jpg"); 
        expect(result.fileId).toBe("mock-file-id");
    });
});

// test upload filepath
describe("upload filepath", () => {
    test("uploads a file from disk and returns transformed response", async () => { 
        const result = await uploadFilePath("/fake/path/image.jpg", { 
            fileName: "test.jpg", 
            folder: "/uploads", 
        }); 
        
        expect(result.url).toBe("https://mock.url/upload.jpg"); 
        expect(result.fileId).toBe("mock-file-id"); 
        expect(result.filePath).toBe("/mock/path"); 
        expect(result.name).toBe("mock.jpg");
    });
});

// test buildImgUrl
describe("buildImgUrl", () => {
    test("should build an image url", async () => {
        const url = buildImageUrl("test.jpg", { width: 100 });

        expect(url).toBe("https://mock.url/image.jpg");
    });
});