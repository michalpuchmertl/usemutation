import { NextApiRequest, NextApiResponse } from "next";
import { getPosts, overwritePosts } from ".";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    findOne(req, res);
  } else if (req.method === "PUT") {
    update(req, res);
  } else if (req.method === "DELETE") {
    // Process the GET request
    remove(req, res);
  } else {
    // Handle other HTTP methods
    res.status(405).end();
  }
}

const findOne = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    res.status(400).end();
    return;
  }

  const posts = await getPosts();
  const post = posts.find((post) => post.id === Number(id));

  if (!post) {
    res.status(404).end();
    return;
  }

  res.status(200).json(post);
};

const update = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;
  const { heading, content } = req.body;

  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    res.status(400).end();
    return;
  }

  if (!heading || !content) {
    res.status(400).end();
    return;
  }

  const posts = await getPosts();

  // find the post, update it and use overwritePosts to save it
  const post = posts.find((post) => post.id === Number(id));

  if (!post) {
    res.status(404).end();
    return;
  }

  post.heading = heading;
  post.content = content;

  await overwritePosts(posts);

  res.status(200).json(post);
};

const remove = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    res.status(400).end();
    return;
  }

  const posts = await getPosts();

  const post = posts.find((post) => post.id === Number(id));

  if (!post) {
    res.status(404).end();
    return;
  }

  const newPosts = posts.filter((post) => post.id !== Number(id));

  res.status(200).json(await overwritePosts(newPosts));
};
