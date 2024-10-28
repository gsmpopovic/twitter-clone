// CategoryBarChart.js
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

// Register the necessary chart modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CategoryBarChart = ({ data }) => {
  const chartData = {
    labels: data?.map((item) => item.category) || [],
    datasets: [
      {
        label: "# Posts by Category",
        data: data?.map((item) => item.count) || [],
        backgroundColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(255, 206, 86)",
          "rgb(143, 214, 148)",
          "rgb(255, 159, 64)",
        ],
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
      <h2 style={{ fontSize: "1.5em", color: "#555" }}>Post Category Analysis</h2>
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
          },
          scales: {
            x: {
              type: "category", // Ensure 'category' scale type is set for x-axis
            },
            y: {
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default CategoryBarChart;
