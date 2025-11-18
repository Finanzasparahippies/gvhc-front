import React, { useEffect, useState } from "react";
import API from "../../../utils/API";
import { FiAlertTriangle } from "react-icons/fi";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  level: string;
  image?: string;
}

interface NewsTickerProps {
  sourceUrl?: string; // Opcional, si quieres traer las noticias de una API
}

const NewsTicker: React.FC<NewsTickerProps> = ({ sourceUrl }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchNews = async () => {
    try {
      if (sourceUrl) {
        const response = await API.get<NewsItem[]>(sourceUrl);  // Usamos Axios
        console.log("response from news:", response.data)
        setNews(response.data);
      } else {
        setNews([
          {
            id: 1,
            title: "System Maintenance",
            summary: "Scheduled maintenance on Sunday at 2 AM.",
            level: "warning",
          },
          {
            id: 2,
            title: "New Provider Line Update",
            summary: "Provider Hotline is now handling bilingual calls.",
            level: "info",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchNews();
  const intervalId = setInterval(fetchNews, 300000);
  return () => clearInterval(intervalId);
}, [sourceUrl]);


  if (loading) return null;
  if (news.length === 0) return null;

  return (
    <div className="animate-fade-in-down mt-4 text-center px-4 py-4 bg-gray-800 rounded-lg shadow-md border border-purple-500 overflow-hidden">
      {/* <h2 className="text-3xl font-bold text-purple-400 mb-2 flex items-center justify-center gap-2">
        <FiAlertTriangle className="text-yellow-400" /> News & Alerts
      </h2> */}
      <div className="overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block">
          {news.map((item) => (
            <span
              key={item.id}
              className={`mx-8 text-8xl font-semibold ${
                item.level === "critical"
                  ? "text-red-500"
                  : item.level === "warning"
                  ? "text-yellow-400"
                  : "text-purple-300"
              }`}
            >
              🔹 {item.title}: <span className="text-gray-200">{item.summary}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;


