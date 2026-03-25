import React from 'react';

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: 'How to Stay Safe While Dating Online',
      excerpt: 'Tips and tricks for protecting your privacy and staying safe while meeting new people online.',
      date: 'Coming Soon',
      category: 'Safety',
      icon: '🛡️'
    },
    {
      id: 2,
      title: 'The Evolution of College Dating',
      excerpt: 'How dating has changed for college students and why authenticity matters more than ever.',
      date: 'Coming Soon',
      category: 'Culture',
      icon: '💕'
    },
    {
      id: 3,
      title: 'Privacy First: Why Your Data Matters',
      excerpt: 'Understanding why end-to-end encryption is essential for modern dating apps.',
      date: 'Coming Soon',
      category: 'Privacy',
      icon: '🔐'
    },
  ];

  return (
    <div className="pt-20 pb-20">
      <section className="bg-gradient-to-br from-creamyWhite to-warmCream py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-darkBrown text-center mb-4">📚 CU Daters Blog</h1>
          <p className="text-lg text-softBrown text-center mb-12">
            Stories, tips, and insights about dating, privacy, and building real connections in college.
          </p>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-8 text-center mb-12">
            <p className="text-4xl mb-4">✍️</p>
            <p className="text-2xl font-bold text-amber-600">Blog Coming Soon</p>
            <p className="text-softBrown mt-2">We're preparing amazing content! In the meantime, follow us on Instagram for updates.</p>
            <a 
              href="https://www.instagram.com/cudaters/?hl=en" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blushPink to-softPink text-white font-bold rounded-full hover:shadow-lg transition"
            >
              Follow on Instagram
            </a>
          </div>

          {/* Featured Posts Preview */}
          <div className="grid md:grid-cols-1 gap-8">
            {blogPosts.map((post) => (
              <div key={post.id} className="card opacity-50 pointer-events-none">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{post.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-blushPink text-white px-3 py-1 rounded-full">{post.category}</span>
                      <span className="text-xs text-softBrown font-semibold">{post.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-darkBrown mb-3">{post.title}</h3>
                    <p className="text-softBrown mb-4">{post.excerpt}</p>
                    <button className="text-blushPink font-bold hover:underline cursor-not-allowed">Read More →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subscribe Section */}
          <div className="bg-gradient-to-r from-blushPink to-softPink rounded-2xl p-8 text-center my-12 text-white">
            <h2 className="text-2xl font-bold mb-4">Subscribe for Updates</h2>
            <p className="mb-6 text-gray-100">Get notified when we publish new blog posts about dating, privacy, and college life.</p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="flex-1 px-4 py-3 rounded-lg text-darkBrown focus:outline-none"
              />
              <button className="px-6 py-3 bg-white text-blushPink font-bold rounded-lg hover:scale-105 transition">
                Subscribe
              </button>
            </div>
          </div>

          {/* Alternative */}
          <div className="text-center mt-12">
            <p className="text-softBrown mb-4">Want to read something now?</p>
            <p className="text-sm text-gray-500">
              Follow our <a href="https://www.instagram.com/cudaters/?hl=en" target="_blank" rel="noopener noreferrer" className="text-blushPink font-bold hover:underline">Instagram page</a> for daily tips and updates!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
