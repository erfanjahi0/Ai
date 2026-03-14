import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';

// --- HARDCODED CONFIGURATION ---
const BLOGGER_API_KEY = 'AIzaSyCl2qhx-sTl_8yMGaASQKvLFsz0lLCGfBM';
const BLOGGER_BLOG_ID = '6570421891733638741';
const BLOG_DOMAIN = 'amazingnaturalbeeauty.blogspot.com'; 
// -------------------------------

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = (ctx.query.postpath as string[]) || [];
  const path = '/' + pathArr.join('/');
  const fbclid = ctx.query.fbclid;

  // Redirect real Facebook visitors to your actual blog
  if (referringURL?.includes('facebook.com') || fbclid) {
    return {
      redirect: {
        permanent: false,
        destination: `https://${BLOG_DOMAIN}${encodeURI(path)}`,
      },
    };
  }

  // Fetch post data from Blogger API for the crawler
  try {
    const res = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts/bypath?path=${encodeURI(path)}&key=${BLOGGER_API_KEY}`
    );

    if (!res.ok) {
      return { notFound: true };
    }

    const post = await res.json();

    if (!post || post.error) {
      return { notFound: true };
    }

    return {
      props: {
        post: {
          title: post.title || '',
          content: post.content || '',
          published: post.published || '',
          updated: post.updated || '',
          authorName: post.author?.displayName || '',
          url: post.url || '',
        },
        host: ctx.req.headers.host || '',
        path,
      },
    };
  } catch {
    return { notFound: true };
  }
};

interface PostProps {
  post: {
    title: string;
    content: string;
    published: string;
    updated: string;
    authorName: string;
    url: string;
  };
  host: string;
  path: string;
}

const Post: React.FC<PostProps> = ({ post, host }) => {
  const removeTags = (str: string) => {
    if (!str) return '';
    return str
      .toString()
      .replace(/(<([^>]+)>)/gi, '')
      .replace(/\[[^\]]*\]/, '')
      .slice(0, 160);
  };

  const excerpt = removeTags(post.content);

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host?.split('.')[0] || 'Blog'} />
        <meta property="article:published_time" content={post.published} />
        <meta property="article:modified_time" content={post.updated} />
        <meta name="description" content={excerpt} />
      </Head>
      <div className="post-container">
        <style jsx>{`
          .post-container { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
          h1 { color: #333; }
          article { line-height: 1.6; }
        `}</style>
        <h1>{post.title}</h1>
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
