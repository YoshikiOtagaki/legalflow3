// Chart Component
import React, { useRef, useEffect } from "react";

interface ChartProps {
  type: "line" | "bar" | "pie" | "doughnut" | "area";
  data: any;
  options?: any;
  width?: number;
  height?: number;
  className?: string;
}

export function Chart({
  type,
  data,
  options = {},
  width = 400,
  height = 300,
  className = "",
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw chart based on type
    switch (type) {
      case "line":
        drawLineChart(ctx, data, options);
        break;
      case "bar":
        drawBarChart(ctx, data, options);
        break;
      case "pie":
        drawPieChart(ctx, data, options);
        break;
      case "doughnut":
        drawDoughnutChart(ctx, data, options);
        break;
      case "area":
        drawAreaChart(ctx, data, options);
        break;
    }
  }, [type, data, options, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}

// Line Chart
function drawLineChart(ctx: CanvasRenderingContext2D, data: any, options: any) {
  const { datasets, labels } = data;
  const { width, height } = ctx.canvas;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min and max values
  let minValue = Infinity;
  let maxValue = -Infinity;

  datasets.forEach((dataset: any) => {
    dataset.data.forEach((value: number) => {
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    });
  });

  const valueRange = maxValue - minValue;
  const stepX = chartWidth / (labels.length - 1);
  const stepY = chartHeight / valueRange;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw grid lines
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Draw datasets
  datasets.forEach((dataset: any, datasetIndex: number) => {
    ctx.strokeStyle = dataset.borderColor || "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    dataset.data.forEach((value: number, index: number) => {
      const x = padding + stepX * index;
      const y = height - padding - (value - minValue) * stepY;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = dataset.backgroundColor || "#3b82f6";
    dataset.data.forEach((value: number, index: number) => {
      const x = padding + stepX * index;
      const y = height - padding - (value - minValue) * stepY;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  });

  // Draw labels
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  labels.forEach((label: string, index: number) => {
    const x = padding + stepX * index;
    ctx.fillText(label, x, height - padding + 20);
  });
}

// Bar Chart
function drawBarChart(ctx: CanvasRenderingContext2D, data: any, options: any) {
  const { datasets, labels } = data;
  const { width, height } = ctx.canvas;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find max value
  let maxValue = -Infinity;
  datasets.forEach((dataset: any) => {
    dataset.data.forEach((value: number) => {
      maxValue = Math.max(maxValue, value);
    });
  });

  const barWidth = (chartWidth / labels.length) * 0.8;
  const barSpacing = (chartWidth / labels.length) * 0.2;
  const stepY = chartHeight / maxValue;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw bars
  datasets.forEach((dataset: any, datasetIndex: number) => {
    ctx.fillStyle = dataset.backgroundColor || "#3b82f6";

    dataset.data.forEach((value: number, index: number) => {
      const x = padding + (barWidth + barSpacing) * index + barSpacing / 2;
      const barHeight = value * stepY;
      const y = height - padding - barHeight;

      ctx.fillRect(x, y, barWidth, barHeight);
    });
  });

  // Draw labels
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  labels.forEach((label: string, index: number) => {
    const x = padding + (barWidth + barSpacing) * index + barWidth / 2;
    ctx.fillText(label, x, height - padding + 20);
  });
}

// Pie Chart
function drawPieChart(ctx: CanvasRenderingContext2D, data: any, options: any) {
  const { datasets } = data;
  const { width, height } = ctx.canvas;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  const dataset = datasets[0];
  const total = dataset.data.reduce(
    (sum: number, value: number) => sum + value,
    0,
  );

  let currentAngle = -Math.PI / 2;

  dataset.data.forEach((value: number, index: number) => {
    const sliceAngle = (value / total) * 2 * Math.PI;

    ctx.fillStyle =
      dataset.backgroundColor[index] || `hsl(${index * 60}, 70%, 50%)`;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();

    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
    const labelY = centerY + Math.sin(labelAngle) * (radius + 20);

    ctx.fillStyle = "#374151";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(dataset.labels[index], labelX, labelY);

    currentAngle += sliceAngle;
  });
}

// Doughnut Chart
function drawDoughnutChart(
  ctx: CanvasRenderingContext2D,
  data: any,
  options: any,
) {
  const { datasets } = data;
  const { width, height } = ctx.canvas;

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const innerRadius = outerRadius * 0.6;

  const dataset = datasets[0];
  const total = dataset.data.reduce(
    (sum: number, value: number) => sum + value,
    0,
  );

  let currentAngle = -Math.PI / 2;

  dataset.data.forEach((value: number, index: number) => {
    const sliceAngle = (value / total) * 2 * Math.PI;

    ctx.fillStyle =
      dataset.backgroundColor[index] || `hsl(${index * 60}, 70%, 50%)`;
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      outerRadius,
      currentAngle,
      currentAngle + sliceAngle,
    );
    ctx.arc(
      centerX,
      centerY,
      innerRadius,
      currentAngle + sliceAngle,
      currentAngle,
      true,
    );
    ctx.closePath();
    ctx.fill();

    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (outerRadius + 20);
    const labelY = centerY + Math.sin(labelAngle) * (outerRadius + 20);

    ctx.fillStyle = "#374151";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(dataset.labels[index], labelX, labelY);

    currentAngle += sliceAngle;
  });
}

// Area Chart
function drawAreaChart(ctx: CanvasRenderingContext2D, data: any, options: any) {
  const { datasets, labels } = data;
  const { width, height } = ctx.canvas;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min and max values
  let minValue = Infinity;
  let maxValue = -Infinity;

  datasets.forEach((dataset: any) => {
    dataset.data.forEach((value: number) => {
      minValue = Math.min(minValue, value);
      maxValue = Math.max(maxValue, value);
    });
  });

  const valueRange = maxValue - minValue;
  const stepX = chartWidth / (labels.length - 1);
  const stepY = chartHeight / valueRange;

  // Draw axes
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Draw area
  datasets.forEach((dataset: any, datasetIndex: number) => {
    ctx.fillStyle = dataset.backgroundColor || "rgba(59, 130, 246, 0.3)";
    ctx.beginPath();

    // Start from bottom left
    ctx.moveTo(padding, height - padding);

    // Draw the line
    dataset.data.forEach((value: number, index: number) => {
      const x = padding + stepX * index;
      const y = height - padding - (value - minValue) * stepY;

      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Close the area
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw the line
    ctx.strokeStyle = dataset.borderColor || "#3b82f6";
    ctx.lineWidth = 2;
    ctx.beginPath();

    dataset.data.forEach((value: number, index: number) => {
      const x = padding + stepX * index;
      const y = height - padding - (value - minValue) * stepY;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  });

  // Draw labels
  ctx.fillStyle = "#6b7280";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  labels.forEach((label: string, index: number) => {
    const x = padding + stepX * index;
    ctx.fillText(label, x, height - padding + 20);
  });
}

// Timesheet Chart
export function TimesheetChart({
  data,
  className = "",
}: {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  className?: string;
}) {
  return (
    <Chart
      type="line"
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
      }}
      className={className}
    />
  );
}

// Case Status Chart
export function CaseStatusChart({
  data,
  className = "",
}: {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
    }>;
  };
  className?: string;
}) {
  return (
    <Chart
      type="doughnut"
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
      }}
      className={className}
    />
  );
}

// Document Type Chart
export function DocumentTypeChart({
  data,
  className = "",
}: {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor?: string[];
    }>;
  };
  className?: string;
}) {
  return (
    <Chart
      type="pie"
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
      }}
      className={className}
    />
  );
}

// Notification Trend Chart
export function NotificationTrendChart({
  data,
  className = "",
}: {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  className?: string;
}) {
  return (
    <Chart
      type="area"
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
      }}
      className={className}
    />
  );
}
