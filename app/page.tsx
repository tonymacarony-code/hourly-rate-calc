'use client';

import { useState, useEffect, useCallback } from 'react';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';

interface ExpenseItem {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export default function HourlyRateCalculator() {
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [workerName, setWorkerName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  // Helper function to convert decimal hours to hours:minutes format
  const decimalToHoursMinutes = useCallback((decimalHours: number): string => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  // Helper function to convert hours:minutes format to decimal hours
  const hoursMinutesToDecimal = useCallback((hoursMinutes: string): number => {
    if (!hoursMinutes.includes(':')) {
      // If it's already a decimal number, return it as is
      return parseFloat(hoursMinutes) || 0;
    }
    const [hours, minutes] = hoursMinutes.split(':').map(Number);
    return (hours || 0) + (minutes || 0) / 60;
  }, []);

  // Helper function to format hours for display
  const formatHoursForDisplay = useCallback((decimalHours: number): string => {
    return decimalToHoursMinutes(decimalHours);
  }, [decimalToHoursMinutes]);

  // Functions for managing expense items
  const addExpenseItem = () => {
    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      pricePerUnit: 0,
      total: 0
    };
    setExpenseItems([...expenseItems, newItem]);
  };

  const removeExpenseItem = (id: string) => {
    setExpenseItems(expenseItems.filter(item => item.id !== id));
  };

  const updateExpenseItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setExpenseItems(expenseItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate total when quantity or pricePerUnit changes
        if (field === 'quantity' || field === 'pricePerUnit') {
          updatedItem.total = updatedItem.quantity * updatedItem.pricePerUnit;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate total expenses
  const getTotalExpenses = useCallback(() => {
    return expenseItems.reduce((sum, item) => sum + item.total, 0);
  }, [expenseItems]);

  useEffect(() => {
    // Calculate hours from time difference if both times are provided
    let calculatedHours = hoursMinutesToDecimal(hoursWorked);

    if (startTime && endTime) {
      const start = new Date(`2000-01-01T${startTime}:00`);
      const end = new Date(`2000-01-01T${endTime}:00`);

      let diffMs = end.getTime() - start.getTime();

      // Handle case where end time is next day (e.g., night shift)
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
      }

      calculatedHours = diffMs / (1000 * 60 * 60); // Convert to hours

      // Update hoursWorked field with calculated value in hours:minutes format
      const formattedHours = formatHoursForDisplay(calculatedHours);
      if (formattedHours !== hoursWorked) {
        setHoursWorked(formattedHours);
      }
    }

    const rate = parseFloat(hourlyRate) || 0;
    const totalExpenses = getTotalExpenses();

    const grossIncome = rate * calculatedHours;
    const netIncome = grossIncome + totalExpenses;

    setTotal(netIncome);
  }, [hourlyRate, hoursWorked, startTime, endTime, expenseItems, formatHoursForDisplay, hoursMinutesToDecimal, getTotalExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Prepare invoice data for PDF generation
  const getInvoiceData = () => {
    // Prepare product lines (work + expenses)
    const workHours = hoursMinutesToDecimal(hoursWorked);
    const productLines = [
      {
        description: 'Work',
        quantity: workHours.toFixed(2),
        rate: (parseFloat(hourlyRate) || 0).toFixed(2)
      },
      ...expenseItems.map(expense => ({
        description: expense.name || 'Expense Item',
        quantity: expense.quantity.toString(),
        rate: expense.pricePerUnit.toFixed(2)
      }))
    ];

    return {
      title: 'INVOICE',
      companyName: workerName || 'Service Provider',
      name: workerName || 'Service Provider',
      billTo: 'BILL TO',
      clientName: clientName || 'Client',
      clientAddress: clientAddress || '',
      invoiceTitleLabel: 'Invoice#',
      invoiceTitle: `INV-${Date.now()}`,
      invoiceDateLabel: 'Invoice Date',
      invoiceDate: new Date().toLocaleDateString('en-US'),
      invoiceDueDateLabel: 'Due Date',
      invoiceDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US'),
      productLineDescription: 'Description',
      productLineQuantity: 'Qty',
      productLineQuantityRate: 'Rate',
      productLineQuantityAmount: 'Amount',
      productLines: productLines,
      subTotalLabel: 'Subtotal',
      totalLabel: 'TOTAL',
      currency: '$'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              InvoiceFlow
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Professional hourly rate calculator & invoice generator
            </p>
          </div>

          <div className="space-y-6">
            {/* Worker Name */}
            <div>
              <label htmlFor="workerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name (From)
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

            {/* Client Address */}
            <div>
              <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Address
              </label>
              <textarea
                id="clientAddress"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg resize-none"
                placeholder="123 Main St, City, State 12345"
                rows={2}
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
                  type="text"
                  id="hoursWorked"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-lg"
                  placeholder="8:00"
                  pattern="[0-9]+:[0-5][0-9]"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">h:m</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: hours:minutes (e.g., 8:30)
              </p>
            </div>

            {/* Expenses */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expenses
                </label>
                <button
                  type="button"
                  onClick={addExpenseItem}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded-lg transition-colors"
                >
                  + Add Expense
                </button>
              </div>

              {expenseItems.length > 0 && (
                <div className="space-y-3">
                  {expenseItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateExpenseItem(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                            placeholder="Expense name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateExpenseItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Price per Unit ($)
                          </label>
                          <input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => updateExpenseItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white text-sm"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExpenseItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Expenses:
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(getTotalExpenses())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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

              {/* Create Invoice Button */}
              <div className="mt-4">
                <InvoiceDownloadButton invoiceData={getInvoiceData()} />
              </div>
            </div>

            {/* Breakdown */}
            {(hourlyRate && hoursWorked) && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total for Work:</span>
                  <span className="font-medium">{formatCurrency((parseFloat(hourlyRate) || 0) * hoursMinutesToDecimal(hoursWorked))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Expenses:</span>
                  <span className="font-medium text-green-600">+{formatCurrency(getTotalExpenses())}</span>
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
