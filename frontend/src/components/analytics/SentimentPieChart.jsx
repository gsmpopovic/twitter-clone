// SentimentPieChart.js
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register the necessary chart elements
ChartJS.register(ArcElement, Tooltip, Legend);

const SentimentPieChart = ({ data }) => {
  const chartData = {
    labels: data?.map((item) => item.label) || [],
    datasets: [
      {
        data: data?.map((item) => item.count) || [],
        backgroundColor: ["rgb(255, 99, 132)", "rgb(54, 162, 235)", "rgb(255, 206, 86)"],
      },
    ],
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        maxHeight: "600px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        margin: "20px auto",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.5em", color: "#555" }}>Post Sentiment Analysis</h2>
      <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
    </div>
  );
};

export default SentimentPieChart;
