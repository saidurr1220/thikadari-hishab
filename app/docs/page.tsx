import Link from "next/link";

export default function DocsPage() {
  const docs = [
    {
      title: "START_HERE.md",
      description: "Quick start guide - Read this first!",
      href: "/START_HERE.md",
      icon: "🚀",
      priority: "high",
    },
    {
      title: "SETUP_INSTRUCTIONS.md",
      description: "Detailed setup instructions",
      href: "/SETUP_INSTRUCTIONS.md",
      icon: "📋",
      priority: "high",
    },
    {
      title: "PROJECT_COMPLETE.md",
      description: "Complete project summary",
      href: "/PROJECT_COMPLETE.md",
      icon: "✅",
      priority: "high",
    },
    {
      title: "00_COMPLETE_SPECIFICATION.md",
      description: "Complete system specification",
      href: "/docs/00_COMPLETE_SPECIFICATION.md",
      icon: "📖",
      priority: "medium",
    },
    {
      title: "01_OVERVIEW.md",
      description: "System overview",
      href: "/docs/01_OVERVIEW.md",
      icon: "📄",
      priority: "medium",
    },
    {
      title: "02_SITEMAP.md",
      description: "All routes and pages",
      href: "/docs/02_SITEMAP.md",
      icon: "🗺️",
      priority: "medium",
    },
    {
      title: "03_DATABASE_SCHEMA.sql",
      description: "Database schema (14 tables)",
      href: "/docs/03_DATABASE_SCHEMA.sql",
      icon: "🗄️",
      priority: "high",
    },
    {
      title: "04_RLS_POLICIES.sql",
      description: "Row-level security policies",
      href: "/docs/04_RLS_POLICIES.sql",
      icon: "🔒",
      priority: "high",
    },
    {
      title: "05_SEED_DATA.sql",
      description: "Master data seeding",
      href: "/docs/05_SEED_DATA.sql",
      icon: "🌱",
      priority: "high",
    },
    {
      title: "06_UI_UX_DESIGN.md",
      description: "Mobile-first UI specifications",
      href: "/docs/06_UI_UX_DESIGN.md",
      icon: "🎨",
      priority: "medium",
    },
    {
      title: "07_WORKFLOWS.md",
      description: "Step-by-step user workflows",
      href: "/docs/07_WORKFLOWS.md",
      icon: "🔄",
      priority: "medium",
    },
    {
      title: "08_REPORTS_SPEC.md",
      description: "A4 report specifications",
      href: "/docs/08_REPORTS_SPEC.md",
      icon: "📊",
      priority: "medium",
    },
    {
      title: "09_EXCEL_EXPORT.md",
      description: "Excel export design",
      href: "/docs/09_EXCEL_EXPORT.md",
      icon: "📈",
      priority: "medium",
    },
    {
      title: "10_IMPLEMENTATION.md",
      description: "Code structure and patterns",
      href: "/docs/10_IMPLEMENTATION.md",
      icon: "💻",
      priority: "high",
    },
    {
      title: "QUICK_REFERENCE.md",
      description: "Developer quick reference",
      href: "/docs/QUICK_REFERENCE.md",
      icon: "⚡",
      priority: "high",
    },
    {
      title: "SETUP_GUIDE.md",
      description: "Detailed setup guide",
      href: "/docs/SETUP_GUIDE.md",
      icon: "📚",
      priority: "medium",
    },
  ];

  const highPriority = docs.filter((d) => d.priority === "high");
  const mediumPriority = docs.filter((d) => d.priority === "medium");

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Documentation
          </h1>
          <p className="text-gray-600">
            Complete specification and implementation guide for ঠিকাদারি হিসাব
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            🎯 Start Here
          </h2>
          <p className="text-blue-800 mb-4">
            New to the project? Read these documents in order:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-blue-900">
            <li>START_HERE.md - Quick start guide</li>
            <li>SETUP_INSTRUCTIONS.md - Detailed setup</li>
            <li>Run 3 SQL scripts in Supabase</li>
            <li>10_IMPLEMENTATION.md - Start coding</li>
          </ol>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            🔥 Essential Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {highPriority.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{doc.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📖 Additional Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediumPriority.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{doc.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📊 Project Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">36</div>
              <div className="text-sm text-gray-600">Files Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">14</div>
              <div className="text-sm text-gray-600">Database Tables</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">40+</div>
              <div className="text-sm text-gray-600">RLS Policies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">50+</div>
              <div className="text-sm text-gray-600">Routes/Pages</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
