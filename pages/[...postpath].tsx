import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';

const BLOGGER_API_KEY = process.env.BLOGGER_API_KEY!;
const BLOGGER_BLOG_ID = process.env.BLOGGER_BLOG_ID!;
const BLOG_DOMAIN = process.env.BLOG_DOMAIN!;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = ctx.query.postpath as Array<string>;
  const path = '/' + pathArr.join('/');
  const fbclid = ctx.query.fbclid;

  // Redirect real Facebook visitors straight to your actual blog
  if (referringURL?.includes('facebook.com') || fbclid) {
    return {
      redirect: {
        permanent: false,
        destination: `https://${BLOG_DOMAIN}${encodeURI(path)}`,
      },
    };
  }

  // Serve OG meta tags to Facebook's crawler
  try {
    const res = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts/bypath?path=${encodeURI(path)}&key=${BLOGGER_API_KEY}`
    );

    if (!res.ok) return { notFound: true };

    const post = await res.json();
    if (!post || post.error) return { notFound: true };

    return {
      props: {
        post: {
          title: post.title || '',
          content: post.content || '',
          published: post.published || '',
          updated: post.updated || '',
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
  };
  host: string;
  path: string;
}

const Post: React.FC<PostProps> = ({ post, host, path }) => {
  const stripTags = (str: string) => {
    if (!str) return '';
    return str
      .replace(/(<([^>]+)>)/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
  };

  const excerpt = stripTags(post.content);
  const siteName = host?.split('.')[0] || '';
  const canonicalUrl = `https://${BLOG_DOMAIN}${path}`;

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={excerpt} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={siteName} />
        <meta property="article:published_time" content={post.published} />
        <meta property="article:modified_time" content={post.updated} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={excerpt} />

        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
