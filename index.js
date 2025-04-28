import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { downloadImage } from "./utils.js";
import { RedbookPoster } from "./redbook-poster.js";
import { z } from "zod";

const phone = process.env.phone || "";
const verificationCode = process.env.verificationCode || "";
const jsonPath = process.env.jsonPath || "/Users/xuenai/";

const server = new McpServer({
  name: "RedbookPoster",
  version: "1.0.0",
});

export const createNote = async ({ title, content, images }) => {
  let res = "";
  try {
    const poster = new RedbookPoster(jsonPath);
    const loginRes = await poster.login(phone, verificationCode);
    if (loginRes?.message) {
      return {
        content: [{ type: "text", text: loginRes.message }],
      };
    }
    const localImages = [];
    for (const image of images) {
      if (image.startsWith("http")) {
        const localPath = await downloadImage(image);
        localImages.push(localPath);
      } else {
        localImages.push(image);
      }
    }
    await poster.postArticle(title, content, localImages);
    await poster.close();
    res = "success";
  } catch (err) {
    console.error("err.message", err.message);
    res = err.message;
  }
  return {
    content: [{ type: "text", text: res }],
  };
};

export const createVideoNote = async ({ title, content, videos }) => {
  let res = "";
  try {
    const poster = new RedbookPoster(jsonPath);
    await poster.login(phone, verificationCode);

    const localVideos = [];
    for (const video of videos) {
      if (video.startsWith("http")) {
        const localPath = await downloadImage(video);
        localVideos.push(localPath);
      } else {
        localVideos.push(video);
      }
    }
    await poster.postVideoArticle(title, content, localVideos);
    await poster.close();
    res = "success";
  } catch (err) {
    console.error("err", err);
    res = err.message;
  }
  return [{ type: "text", text: res }];
};

server.tool(
  "create-note",
  {
    title: z.string(),
    content: z.string(),
    images: z.array(z.string()),
  },
  createNote
);

server.tool(
  "create-video-note",
  {
    title: z.string(),
    content: z.string(),
    videos: z.array(z.string()),
  },
  createVideoNote
);

const transport = new StdioServerTransport();
await server.connect(transport);
