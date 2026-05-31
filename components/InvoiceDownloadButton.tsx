'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export interface InvoiceLine {
  description: string;
  quantity: string;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDueDate: string;
  companyName: string;
  companyPhone: string;
  logoSrc: string;
  technicianName?: string;
  clientName: string;
  clientAddress?: string;
  serviceName?: string;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
}

interface InvoiceDownloadButtonProps {
  invoiceData: InvoiceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export function InvoicePrintView({ invoiceData }: InvoiceDownloadButtonProps) {
  return (
    <article className="print-invoice" aria-label="Printable invoice">
      <header className="invoice-header">
        <div className="invoice-brand">
          <Image src={invoiceData.logoSrc} alt="DrillWorks logo" width={220} height={68} className="invoice-logo" />
          <div className="invoice-to">
            <p className="invoice-label">Invoice to</p>
            <dl>
              <div>
                <dt>Name:</dt>
                <dd>{invoiceData.clientName || 'Client'}</dd>
              </div>
              <div>
                <dt>Service:</dt>
                <dd>{invoiceData.serviceName || 'Handyman Service'}</dd>
              </div>
              <div>
                <dt>Company:</dt>
                <dd>{invoiceData.clientName || 'Client'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="invoice-title-block">
          <h1>Invoice</h1>
          <dl>
            <div>
              <dt>Invoice No:</dt>
              <dd>{invoiceData.invoiceNumber}</dd>
            </div>
            <div>
              <dt>Due Date:</dt>
              <dd>{invoiceData.invoiceDueDate}</dd>
            </div>
            <div>
              <dt>Invoice Date:</dt>
              <dd>{invoiceData.invoiceDate}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="invoice-mid-grid">
        <div className="invoice-location">
          <div>
            <p className="invoice-label">Location</p>
            <p>{invoiceData.clientAddress || 'Client address'}</p>
          </div>
        </div>
        <div className="invoice-contact">
          <dl>
            <div>
              <dt>Phone:</dt>
              <dd>{invoiceData.companyPhone}</dd>
            </div>
            <div>
              <dt>Provider:</dt>
              <dd>{invoiceData.companyName}</dd>
            </div>
            <div>
              <dt>Technician:</dt>
              <dd>{invoiceData.technicianName || invoiceData.companyName}</dd>
            </div>
          </dl>
        </div>
        <div className="invoice-payment">
          <h3>Payment Method</h3>
          <dl>
            <div>
              <dt>Status:</dt>
              <dd>Due on receipt</dd>
            </div>
            <div>
              <dt>Accepted:</dt>
              <dd>Cash / Zelle / Card</dd>
            </div>
            <div>
              <dt>Phone:</dt>
              <dd>{invoiceData.companyPhone}</dd>
            </div>
          </dl>
        </div>
      </section>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.lines.map((line, index) => (
            <tr key={`${line.description}-${index}`}>
              <td>{line.description}</td>
              <td>{formatCurrency(line.rate)}</td>
              <td>{line.quantity}</td>
              <td>{formatCurrency(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="invoice-bottom-grid">
        <div className="invoice-terms">
          <h3>Thank you for your business</h3>
        </div>
        <div className="invoice-totals">
          <div>
            <span>Sub-total:</span>
            <strong>{formatCurrency(invoiceData.subtotal)}</strong>
          </div>
          <div className="invoice-grand-total">
            <span>Total:</span>
            <strong>{formatCurrency(invoiceData.total)}</strong>
          </div>
        </div>
      </section>
    </article>
  );
}

export default function InvoiceDownloadButton({ invoiceData }: InvoiceDownloadButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const previousTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const finishPrinting = () => {
      setIsPrinting(false);

      if (previousTitleRef.current) {
        document.title = previousTitleRef.current;
        previousTitleRef.current = null;
      }
    };

    window.addEventListener('afterprint', finishPrinting);

    return () => {
      window.removeEventListener('afterprint', finishPrinting);
    };
  }, []);

  const printInvoice = () => {
    setIsPrinting(true);
    previousTitleRef.current = document.title;
    document.title = `${invoiceData.companyName} ${invoiceData.invoiceNumber}`;
    window.print();
    window.setTimeout(() => {
      setIsPrinting(false);

      if (previousTitleRef.current) {
        document.title = previousTitleRef.current;
        previousTitleRef.current = null;
      }
    }, 600);
  };

  return (
    <button
      type="button"
      onClick={printInvoice}
      disabled={isPrinting}
      className="w-full rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:bg-neutral-400"
    >
      {isPrinting ? 'Opening print dialog...' : 'Print / Save PDF Invoice'}
    </button>
  );
}
