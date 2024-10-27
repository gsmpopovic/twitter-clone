import { useEffect, useState } from "react";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  const sentimentLabels = {
    LABEL_0: "Negative",
    LABEL_1: "Neutral",
    LABEL_2: "Positive",
  };

  const sentimentChartData = {
    labels: dashboardData?.sentimentData?.map((item) => sentimentLabels[item.sentiment] || item.sentiment) || [],
    datasets: [
      {
        data: dashboardData?.sentimentData?.map((item) => item.count) || [],
        backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 206, 86)"],
      },
    ],
  };

  const classificationChartData = {
    labels: dashboardData?.classificationData?.map((item) => item.category) || [],
    datasets: [
      {
        label: "# Posts by Category",
        data: dashboardData?.classificationData?.map((item) => item.count) || [],
        backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 206, 86)", "rgb(143, 214, 148)", "rgb(255, 159, 64)"],
      },
    ],
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2em", textAlign: "center", color: "#333" }}>Dashboard</h1>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
        <div style={{ flex: 1, textAlign: "center", maxWidth: "600px" }}>
          <h2 style={{ fontSize: "1.5em", color: "#555" }}>Overall Metrics</h2>
          <p><strong>Total Users:</strong> {dashboardData?.totalUsers || "N/A"}</p>
          <p><strong>Total Posts:</strong> {dashboardData?.totalPosts || "N/A"}</p>
        </div>

        <div style={{ maxWidth: "600px", maxHeight: "600px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", margin: "20px auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5em", color: "#555" }}>Post Sentiment Analysis</h2>
          <Pie data={sentimentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      <div style={{ marginTop: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px", margin: "20px auto" }}>
        <h2 style={{ fontSize: "1.5em", color: "#555", textAlign: "center" }}>Sentiment Count Percentage</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Sentiment</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Count</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData?.sentimentData?.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                  {sentimentLabels[item.sentiment] || item.sentiment}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{item.count}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{item.percentage}%</td>
              </tr>
            )) || <tr><td colSpan="3" style={{ textAlign: 'center' }}>No Data Available</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxHeight: "600px", maxWidth: "600px", margin: "20px auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5em", color: "#555" }}>Post Category Analysis</h2>
        <Bar
          data={classificationChartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
            },
          }}
        />
      </div>

      <div style={{ marginTop: "40px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px", margin: "20px auto" }}>
        <h2 style={{ fontSize: "1.5em", color: "#555", textAlign: "center" }}>Classification Count Percentage</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Category</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Count</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData?.classificationData?.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{item.category}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{item.count}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>{item.percentage}%</td>
              </tr>
            )) || <tr><td colSpan="3" style={{ textAlign: 'center' }}>No Data Available</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
