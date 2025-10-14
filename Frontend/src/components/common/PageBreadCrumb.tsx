import { Link } from "react-router"; // use react-router-dom

interface BreadcrumbItem {
  title: string;
  path?: string; // optional for the current page
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {items[items.length - 1].title}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span
                    className={`text-sm ${isLast ? "text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {item.title}
                  </span>
                )}
                {!isLast && (
                  <svg
                    className="stroke-current text-black"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
