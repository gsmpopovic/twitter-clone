// Dashboard.js
import { useEffect, useState } from "react";
import SentimentPieChart from "./SentimentPieChart";
import CategoryBarChart from "./CategoryBarChart";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/summary");
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  if (!dashboardData) return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;

  const sentimentData = dashboardData?.sentimentData?.map((item) => ({
    label: item.sentiment,
    count: item.count,
  }));

  const classificationData = dashboardData?.classificationData;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2em", textAlign: "center", color: "#333" }}>Dashboard</h1>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1, textAlign: "center", maxWidth: "600px" }}>
          <h2 style={{ fontSize: "1.5em", color: "#555" }}>Overall Metrics</h2>
          <p><strong>Total Users:</strong> {dashboardData?.totalUsers || "N/A"}</p>
          <p><strong>Total Posts:</strong> {dashboardData?.totalPosts || "N/A"}</p>
        </div>

        <SentimentPieChart data={sentimentData} />
      </div>

      <CategoryBarChart data={classificationData} />
    </div>
  );
};

export default Dashboard;
