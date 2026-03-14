import type { NextPage } from 'next'
import Head from 'next/head'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>My Blog</title>
        <meta name="description" content="A personal blog." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          background: #000;
          color: #ededed;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        header {
          padding: 1.25rem 2rem;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-dot {
          width: 20px;
          height: 20px;
          background: #fff;
          border-radius: 50%;
        }
        .logo-text {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
        }

        main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          gap: 1rem;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #111;
          border: 1px solid #2a2a2a;
          padding: 0.3rem 0.8rem;
          border-radius: 999px;
          font-size: 0.75rem;
          color: #888;
          margin-bottom: 0.5rem;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #fff;
          line-height: 1.1;
        }

        .subtitle {
          font-size: 1rem;
          color: #666;
          max-width: 340px;
          line-height: 1.6;
        }

        .card {
          margin-top: 1.5rem;
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem 2rem;
          max-width: 380px;
          width: 100%;
          text-align: left;
        }
        .card-label {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 0.6rem;
        }
        .card-text {
          font-size: 0.875rem;
          color: #555;
          line-height: 1.6;
        }

        footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #1a1a1a;
          display: flex;
          justify-content: center;
          gap: 2rem;
        }
        footer span {
          font-size: 0.75rem;
          color: #444;
        }
      `}</style>

      <header>
        <div className="logo-dot" />
        <span className="logo-text">My Blog</span>
      </header>

      <main>
        <div className="status-badge">
          <div className="status-dot" />
          All systems operational
        </div>
        <h1>Welcome to<br />My Blog</h1>
        <p className="subtitle">
          This is a personal blog. Posts are served dynamically. There is nothing to see on this page.
        </p>
        <div className="card">
          <p className="card-label">About this site</p>
          <p className="card-text">
            This is a personal blog built with Next.js and deployed on Vercel. Content is hosted externally and linked from individual post URLs. This index page serves as the project root.
          </p>
        </div>
      </main>

      <footer>
        <span>Built with Next.js</span>
        <span>Deployed on Vercel</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </>
  )
}

export default Home
