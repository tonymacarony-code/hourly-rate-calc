'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';

interface InvoiceData {
  title: string;
  companyName: string;
  name: string;
  billTo: string;
  clientName: string;
  clientAddress?: string;
  invoiceTitleLabel: string;
  invoiceTitle: string;
  invoiceDateLabel: string;
  invoiceDate: string;
  invoiceDueDateLabel: string;
  invoiceDueDate: string;
  productLineDescription: string;
  productLineQuantity: string;
  productLineQuantityRate: string;
  productLineQuantityAmount: string;
  productLines: Array<{
    description: string;
    quantity: string;
    rate: string;
  }>;
  subTotalLabel: string;
  totalLabel: string;
  currency: string;
  notesLabel?: string;
  notes?: string;
  termLabel?: string;
  term?: string;
}

interface InvoiceDownloadButtonProps {
  invoiceData: InvoiceData;
}

export default function InvoiceDownloadButton({ invoiceData }: InvoiceDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Colors
      const primaryColor = [59, 130, 246]; // Blue
      const grayColor = [107, 114, 128]; // Gray
      const darkColor = [31, 41, 55]; // Dark gray

      let yPos = 30;

      // Header background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 20, 30);

      // Invoice number (right aligned)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      const invoiceText = `# ${invoiceData.invoiceTitle}`;
      const invoiceTextWidth = doc.getTextWidth(invoiceText);
      doc.text(invoiceText, pageWidth - 20 - invoiceTextWidth, 30);

      yPos = 70;

      // Company and Client Info Section
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');

      // From section
      doc.text('FROM:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(invoiceData.companyName, 20, yPos + 8);

      // To section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TO:', pageWidth / 2 + 10, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(invoiceData.clientName, pageWidth / 2 + 10, yPos + 8);

      // Client address if provided
      if (invoiceData.clientAddress && invoiceData.clientAddress.trim()) {
        const addressLines = doc.splitTextToSize(invoiceData.clientAddress, pageWidth / 2 - 20);
        doc.text(addressLines, pageWidth / 2 + 10, yPos + 16);
      }

      yPos += 35;

      // Invoice details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

      doc.text('INVOICE DATE:', 20, yPos);
      doc.text('DUE DATE:', pageWidth / 2 + 10, yPos);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(invoiceData.invoiceDate, 20, yPos + 8);
      doc.text(invoiceData.invoiceDueDate, pageWidth / 2 + 10, yPos + 8);

      yPos += 35;

      // Table header background
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 5, pageWidth - 40, 15, 'F');

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);

      doc.text('DESCRIPTION', 25, yPos + 5);
      doc.text('QTY', pageWidth - 120, yPos + 5);
      doc.text('RATE', pageWidth - 80, yPos + 5);
      doc.text('AMOUNT', pageWidth - 45, yPos + 5);

      yPos += 20;

      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

      let subTotal = 0;

      invoiceData.productLines.forEach((line, index) => {
        const quantity = parseFloat(line.quantity) || 0;
        const rate = parseFloat(line.rate) || 0;
        const amount = quantity * rate;
        subTotal += amount;

        // Alternate row background
        if (index % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
        }

        // Wrap long descriptions
        const maxWidth = pageWidth - 140;
        const splitDescription = doc.splitTextToSize(line.description, maxWidth);

        doc.text(splitDescription, 25, yPos + 3);
        doc.text(quantity.toString(), pageWidth - 120, yPos + 3);
        doc.text(formatCurrency(rate), pageWidth - 80, yPos + 3);
        doc.text(formatCurrency(amount), pageWidth - 45, yPos + 3);

        yPos += Math.max(12, splitDescription.length * 5 + 7);
      });

      yPos += 10;

      // Totals section
      const totalsStartX = pageWidth - 100;

      // Subtotal line
      doc.line(totalsStartX, yPos, pageWidth - 20, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Subtotal:', totalsStartX, yPos);
      doc.text(formatCurrency(subTotal), pageWidth - 45, yPos);
      yPos += 15;

      // Total line
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(totalsStartX - 5, yPos - 8, 105, 20, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TOTAL:', totalsStartX, yPos + 3);
      doc.text(formatCurrency(subTotal), pageWidth - 45, yPos + 3);

      yPos += 40;

      // Footer line
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(2);
      doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);

      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFontSize(8);
      const dateText = `Generated: ${new Date().toLocaleDateString('en-US')}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, pageWidth - 20 - dateWidth, pageHeight - 20);

      // Save the PDF
      doc.save(`invoice-${invoiceData.invoiceTitle}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('An error occurred while creating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none disabled:hover:scale-100"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          Generating PDF...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Create Invoice PDF
        </>
      )}
    </button>
  );
}