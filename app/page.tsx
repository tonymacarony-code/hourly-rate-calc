'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

export default function HourlyRateCalculator() {
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [expenses, setExpenses] = useState<string>('');
  const [workerName, setWorkerName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    // Calculate hours from time difference if both times are provided
    let calculatedHours = parseFloat(hoursWorked) || 0;

    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);

      let diffMs = end.getTime() - start.getTime();

      // Handle case where end time is next day (e.g., night shift)
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
      }

      calculatedHours = diffMs / (1000 * 60 * 60); // Convert to hours

      // Update hoursWorked field with calculated value
      if (calculatedHours !== parseFloat(hoursWorked)) {
        setHoursWorked(calculatedHours.toFixed(2));
      }
    }

    const rate = parseFloat(hourlyRate) || 0;
    const exp = parseFloat(expenses) || 0;

    const grossIncome = rate * calculatedHours;
    const netIncome = grossIncome + exp;

    setTotal(netIncome);
  }, [hourlyRate, hoursWorked, startTime, endTime, expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Hourly Rate Calculator Report', 20, 30);

    // Worker name (who did the work)
    if (workerName) {
      doc.setFontSize(14);
      doc.text(`From: ${workerName}`, 20, 45);
    }

    // Client name (who receives the report)
    if (clientName) {
      doc.setFontSize(14);
      doc.text(`To: ${clientName}`, 20, workerName ? 60 : 45);
    }

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(12);
    let dateYPos = 60;
    if (workerName) dateYPos += 15;
    if (clientName) dateYPos += 15;
    doc.text(`Generated on: ${currentDate}`, 20, dateYPos);

    // Line separator
    doc.line(20, dateYPos + 10, 190, dateYPos + 10);

    let yPos = dateYPos + 25;
    doc.setFontSize(14);

    // Work details
    if (startTime && endTime) {
      doc.text(`Start Time: ${startTime}`, 20, yPos);
      yPos += 10;
      doc.text(`End Time: ${endTime}`, 20, yPos);
      yPos += 10;
    }

    doc.text(`Hours Worked: ${hoursWorked || '0'} hours`, 20, yPos);
    yPos += 10;
    doc.text(`Hourly Rate: ${formatCurrency(parseFloat(hourlyRate) || 0)}/hour`, 20, yPos);
    yPos += 15;

    // Calculations
    const grossIncome = (parseFloat(hourlyRate) || 0) * (parseFloat(hoursWorked) || 0);
    const expensesAmount = parseFloat(expenses) || 0;
    const netIncome = grossIncome + expensesAmount;

    doc.setFontSize(12);
    doc.text('CALCULATION BREAKDOWN:', 20, yPos);
    yPos += 15;

    doc.text(`Total for Work: ${formatCurrency(grossIncome)}`, 30, yPos);
    yPos += 10;
    doc.text(`Expenses: +${formatCurrency(expensesAmount)}`, 30, yPos);
    yPos += 10;

    // Line separator
    doc.line(30, yPos + 5, 120, yPos + 5);
    yPos += 15;

    // Total
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET INCOME: ${formatCurrency(netIncome)}`, 30, yPos);

    // Save the PDF
    doc.save('hourly-rate-report.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              💰 Hourly Rate Calculator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calculate your income quickly and easily
            </p>
          </div>

          <div className="space-y-6">
            {/* Worker Name */}
            <div>
              <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Worker Name (From)
              </label>
              <input
                type="text"
                id="workerName"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                placeholder="John Doe"
              />
            </div>

            {/* Client Name */}
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Name (To)
              </label>
              <input
                type="text"
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                placeholder="ABC Company"
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hourly Rate ($/hour)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="hourlyRate"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="25"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">$/h</span>
                </div>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>

            {/* End Time */}
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>

            {/* Hours Worked */}
            <div>
              <label htmlFor="hoursWorked" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hours Worked
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="hoursWorked"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="8"
                  min="0"
                  step="0.1"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">h</span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <label htmlFor="expenses" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expenses ($)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="expenses"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="50"
                  min="0"
                  step="0.01"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">$</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                <div className="text-center">
                  <p className="text-sm font-medium opacity-90 mb-1">Total to Receive</p>
                  <p className="text-4xl font-bold">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <div className="mt-4">
                <button
                  onClick={exportToPDF}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to PDF
                </button>
              </div>
            </div>

            {/* Breakdown */}
            {(hourlyRate && hoursWorked) && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total for Work:</span>
                  <span className="font-medium">{formatCurrency((parseFloat(hourlyRate) || 0) * (parseFloat(hoursWorked) || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                  <span className="font-medium text-green-600">+{formatCurrency(parseFloat(expenses) || 0)}</span>
                </div>
                <hr className="border-gray-300 dark:border-gray-600" />
                <div className="flex justify-between font-semibold">
                  <span>Net Income:</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
