import { describe, it, expect } from "vitest";
import { uploadFile } from "../src/lib/storage";

describe("Local File Storage Engine", () => {
    it("POSITIVE: Uploads a valid file and returns a web-accessible URL", async () => {
        const fakeFile = new File(["sample resume content"], "resume.pdf", {
            type: "application/pdf",
        });

        const fileUrl = await uploadFile(fakeFile);

        expect(fileUrl).toMatch(/^\/uploads\/resumes\/\d+-.+\.pdf$/);
    });
});
