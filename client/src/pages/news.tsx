import { NewsFeed } from "@/components/news-feed";

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Live News</h1>
      <NewsFeed />
    </div>
  );
}