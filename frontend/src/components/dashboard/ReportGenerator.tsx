// Report Generator Component
import React, { useState } from "react";
import { Download, FileText, Calendar, Settings, Loader2 } from "lucide-react";
import { useCreateReport } from "../../hooks/use-dashboard";

interface ReportGeneratorProps {
  userId: string;
  onReportGenerated?: (report: any) => void;
  className?: string;
}

export function ReportGenerator({
  userId,
  onReportGenerated,
  className = "",
}: ReportGeneratorProps) {
  const { createReport, generateReport, downloadReport, loading, error } =
    useCreateReport();
  const [formData, setFormData] = useState({
    reportType: "timesheet",
    reportName: "",
    reportFormat: "pdf",
    startDate: "",
    endDate: "",
    parameters: {},
  });
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const reportName =
        formData.reportName ||
        `${formData.reportType} Report - ${new Date().toLocaleDateString()}`;

      const report = await generateReport({
        userId,
        reportType: formData.reportType,
        reportName,
        reportFormat: formData.reportFormat,
        parameters: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          ...formData.parameters,
        },
      });

      setGeneratedReport(report);
      onReportGenerated?.(report);
    } catch (err) {
      console.error("Error generating report:", err);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    try {
      const downloadUrl = await downloadReport(generatedReport.id);

      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${generatedReport.reportName}.${generatedReport.reportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Generate Report
        </h2>

        <form onSubmit={handleGenerateReport} className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={formData.reportType}
              onChange={(e) => handleFieldChange("reportType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="timesheet">Timesheet Report</option>
              <option value="cases">Case Report</option>
              <option value="documents">Document Report</option>
              <option value="notifications">Notification Report</option>
              <option value="dashboard">Dashboard Summary</option>
            </select>
          </div>

          {/* Report Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={formData.reportName}
              onChange={(e) => handleFieldChange("reportName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter report name (optional)"
            />
          </div>

          {/* Report Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <select
              value={formData.reportFormat}
              onChange={(e) =>
                handleFieldChange("reportFormat", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleFieldChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </form>

        {/* Generated Report */}
        {generatedReport && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Report Generated Successfully
                </h3>
                <p className="text-sm text-green-600">
                  {generatedReport.reportName} (
                  {generatedReport.reportFormat.toUpperCase()})
                </p>
                <p className="text-xs text-green-500">
                  Generated at:{" "}
                  {new Date(generatedReport.generatedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleDownloadReport}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Report Buttons
export function QuickReportButtons({
  userId,
  onReportGenerated,
  className = "",
}: {
  userId: string;
  onReportGenerated?: (report: any) => void;
  className?: string;
}) {
  const { generateReport, loading } = useCreateReport();

  const handleQuickReport = async (
    reportType: string,
    reportFormat: string = "pdf",
  ) => {
    try {
      const report = await generateReport({
        userId,
        reportType,
        reportName: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        reportFormat,
        parameters: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // Last 30 days
          endDate: new Date().toISOString().split("T")[0], // Today
        },
      });

      onReportGenerated?.(report);
    } catch (err) {
      console.error("Error generating quick report:", err);
    }
  };

  const quickReports = [
    {
      type: "timesheet",
      label: "Timesheet Report",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      type: "cases",
      label: "Case Report",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      type: "documents",
      label: "Document Report",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      type: "notifications",
      label: "Notification Report",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {quickReports.map((report) => (
        <button
          key={report.type}
          onClick={() => handleQuickReport(report.type)}
          disabled={loading}
          className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {report.icon}
              <span className="ml-2 text-sm font-medium">{report.label}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// Report Status Indicator
export function ReportStatusIndicator({
  report,
  className = "",
}: {
  report: any;
  className?: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FileText className="w-4 h-4" />;
      case "generating":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "failed":
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
      >
        {getStatusIcon(report.status)}
        <span className="ml-1">{report.status}</span>
      </div>
      <span className="text-sm text-gray-600">
        {report.reportName} ({report.reportFormat.toUpperCase()})
      </span>
    </div>
  );
}
