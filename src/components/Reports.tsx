import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';
import AttendanceChart from './reports/AttendanceChart';
import DepartmentChart from './reports/DepartmentChart';
import ReportSummary from './reports/ReportSummary';
import TopEvents from './reports/TopEvents';
import GrowthMetrics from './reports/GrowthMetrics';
import { reportsAPI, dashboardAPI, eventsAPI } from '../services/api';
import Footer from './Footer';

const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Current Month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getDateRange = () => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (selectedPeriod === 'Current Month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = today;
    } else if (selectedPeriod === 'Last 3 Months') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      endDate = today;
    } else if (selectedPeriod === 'Last 6 Months') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      endDate = today;
    } else if (selectedPeriod === 'This Year') {
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = today;
    } else if (selectedPeriod === 'Custom') {
      if (customStart) startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
    }
    return { startDate, endDate };
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate.toISOString());
      if (endDate) query.append('endDate', endDate.toISOString());
      const [attendanceTrend, departmentDistribution, monthlySummary, topEvents, growthMetrics, eventsRes] = await Promise.all([
        reportsAPI.getAttendanceTrend(query.toString()),
        reportsAPI.getDepartmentDistribution(),
        reportsAPI.getMonthlySummary(query.toString()),
        reportsAPI.getTopEvents(query.toString()),
        reportsAPI.getGrowthMetrics(query.toString()),
        eventsAPI.getAll({ limit: 1000, startDate: startDate?.toISOString(), endDate: endDate?.toISOString(), status: 'Completed' })
      ]);
      // Sort events by date descending
      const sortedEvents = (eventsRes.events || [])
       
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReportData({
        attendanceTrend,
        departmentDistribution,
        monthlySummary,
        topEvents,
        growthMetrics,
      });
      setEventsList(sortedEvents);
      setIsModalOpen(true);
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Fellowship Report</title><link rel="icon" type="image/svg+xml" href="/src/assets/rhsflogo-removebg-preview.ico" />');
      printWindow.document.write('<style>'+
        'body{font-family:sans-serif;} '+ 
        'h2{text-align:center; display: flex; align-items: center; } '+
        '.icon{width: 5%; position: relative; left: 50%;}   '+
        'h2{text-align: center;} '+
        'table{border-collapse:collapse;width:100%;} '+
        'th,td{border:1px solid #ccc;padding:8px;} '+
        'th{background:#f0f0f0;}'+
         '</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<span class="header"><img src="/src/assets/rhsflogo-removebg-preview.png" class="icon"/></span>');
      printWindow.document.write('<h2>MULTIMEDIA UNIVERSITY REPENTANCE AND HOLINESS STUDENTS FELLOWSHIP REPORT</h2>');
      printWindow.document.write('<h2>Monthly Fellowship Activities</h2>');
      printWindow.document.write('<table><tr><th>DATE</th><th>EVENT NAME</th><th>NO. OF ATTENDEES</th><th>NO. OF VISITORS</th><th>THEME VERSE</th></tr>');
      eventsList.forEach((event: any) => {
        // Combine description and speakers information
        const descriptionWithSpeakers = event.speakers 
          ? `${event.description} (Speaker: ${event.speakers})`
          : event.description;
        printWindow.document.write(`<tr><td>${event.date ? event.date.split('T')[0] : ''}</td><td>${event.name}</td><td>${event.attendeesCount ?? '-'}</td><td>${event.visitorsCount ?? '-'}</td><td>${descriptionWithSpeakers}</td></tr>`);
      });
      printWindow.document.write('</table>');
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view fellowship reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option>Current Month</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>This Year</option>
            <option>Custom</option>
          </select>
          {selectedPeriod === 'Custom' && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
            </>
          )}
          <button
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            <FileText className="w-4 h-4" />
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AttendanceChart />
        <DepartmentChart />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ReportSummary />
        <TopEvents />
        <GrowthMetrics />
      </div>

      {/* Printable Report Modal */}
      {isModalOpen && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Fellowship Report</h2>
              <h3 className="text-lg font-semibold mt-6 mb-2">Monthly Fellowship Activities</h3>
              <table className="w-full mb-4">
                <thead><tr><th className="text-left">Date</th><th className="text-left">Event Name</th><th className="text-left">No. of Attendees</th><th className="text-left">No. of Visitors</th><th>Description</th></tr></thead>
                <tbody>
                  {eventsList.map((event, idx) => {
                    // Combine description and speakers information
                    const descriptionWithSpeakers = event.speakers 
                      ? `${event.description} (Speaker: ${event.speakers})`
                      : event.description;
                    return (
                      <tr key={idx}>
                        <td>{event.date ? event.date.split('T')[0] : ''}</td>
                        <td>{event.name}</td>
                        <td>{event.attendeesCount ?? '-'}</td>
                        <td>{event.visitorsCount ?? '-'}</td>
                        <td>{descriptionWithSpeakers}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={handlePrint}
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Reports;