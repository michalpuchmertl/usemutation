import fs from "fs/promises";
import { NextApiRequest, NextApiResponse } from "next";

import POSTS from "@/database.json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    create(req, res);
  } else if (req.method === "GET") {
    // Process the GET request
    findAll(req, res);
  } else {
    // Handle other HTTP methods
    res.status(405).end();
  }
}

const create = async (req: NextApiRequest, res: NextApiResponse) => {
  const { heading, content } = req.body;

  if (!heading || !content) {
    res.status(400).end();
    return;
  }

  const posts = await getPosts();
  const post = {
    id: posts.length + 1,
    heading,
    content,
  };

  posts.push(post);
  await overwritePosts(posts);

  res.status(201).json(post);
};

const findAll = async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json(await getPosts());
};

export const getPosts = async (): Promise<typeof POSTS> => {
  const posts = await fs.readFile("database.json", "utf-8");
  const data = JSON.parse(posts) as typeof POSTS;

  return data.sort((a, b) => b.id - a.id);
};

export const overwritePosts = async (posts: typeof POSTS) => {
  await fs.writeFile("database.json", JSON.stringify(posts));
  return posts;
};
