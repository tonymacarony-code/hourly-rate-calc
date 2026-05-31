'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import InvoiceDownloadButton, { InvoiceData, InvoiceLine, InvoicePrintView } from '../components/InvoiceDownloadButton';

interface ProductLineItem {
  id: string;
  name: string;
  quantity: string;
  pricePerUnit: string;
}

interface ProductPreset {
  name: string;
  price: string;
}

interface SavedDraft {
  hourlyRate: string;
  hoursWorked: string;
  startTime: string;
  endTime: string;
  productLines: ProductLineItem[];
  technicianName: string;
  clientName: string;
  clientAddress: string;
  serviceName: string;
}

interface NumberStepperProps {
  ariaLabel: string;
  value: string;
  min?: number;
  step: number;
  onChange: (value: string) => void;
}

const COMPANY = {
  name: 'DrillWorks',
  phone: '7473379295',
  logoSrc: '/logo.svg',
};

const SERVICE_PRESETS = [
  'TV Mounting',
  'Furniture Assembly',
  'General Mounting',
  'Handyman Service',
];

const PRODUCT_PRESETS: ProductPreset[] = [
  { name: 'Anchor 75 lbs', price: '1' },
  { name: 'Toggle bolt', price: '5' },
  { name: 'Screws / nails', price: '0.5' },
  { name: 'TV mount flat', price: '50' },
  { name: 'TV mount full motion', price: '80' },
  { name: 'Drywall anchors pack', price: '6' },
  { name: 'Concrete anchors', price: '8' },
  { name: 'Lag bolts', price: '4' },
  { name: 'Cable concealer kit', price: '25' },
  { name: 'HDMI cable', price: '15' },
  { name: 'Drywall patch kit', price: '12' },
  { name: 'Caulk tube', price: '8' },
];

const DRAFT_STORAGE_KEY = 'drillworks.invoiceDraft';
const CUSTOM_PRODUCTS_STORAGE_KEY = 'drillworks.customProductPresets';

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseNumber = (value: string) => {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return 0;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getDecimalPlaces = (value: number | string) => {
  const [, decimals = ''] = value.toString().split('.');
  return decimals.length;
};

const formatStepperValue = (value: number, currentValue: string, step: number) => {
  const precision = Math.min(Math.max(getDecimalPlaces(currentValue), getDecimalPlaces(step)), 6);
  return value
    .toFixed(precision)
    .replace(/\.?0+$/, '');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const isProductPreset = (value: unknown): value is ProductPreset => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as ProductPreset;
  return typeof product.name === 'string' && typeof product.price === 'string';
};

const isProductLineItem = (value: unknown): value is ProductLineItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const line = value as ProductLineItem;
  return (
    typeof line.id === 'string' &&
    typeof line.name === 'string' &&
    typeof line.quantity === 'string' &&
    typeof line.pricePerUnit === 'string'
  );
};

function NumberStepper({ ariaLabel, value, min = 0, step, onChange }: NumberStepperProps) {
  const updateByStep = (direction: -1 | 1) => {
    const nextValue = parseNumber(value) + step * direction;
    const clampedValue = Math.max(min, nextValue);
    onChange(formatStepperValue(clampedValue, value, step));
  };

  return (
    <div className="grid h-10 grid-cols-[34px_minmax(0,1fr)_34px] overflow-hidden rounded-md border border-neutral-300 bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => updateByStep(-1)}
        className="grid place-items-center border-r border-neutral-300 bg-stone-50 text-lg font-semibold leading-none transition hover:bg-stone-100"
      >
        -
      </button>
      <input
        type="number"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 border-0 px-2 text-center text-sm outline-none"
        min={min}
        step={step}
      />
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => updateByStep(1)}
        className="grid place-items-center border-l border-neutral-300 bg-stone-50 text-lg font-semibold leading-none transition hover:bg-stone-100"
      >
        +
      </button>
    </div>
  );
}

export default function HourlyRateCalculator() {
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [productLines, setProductLines] = useState<ProductLineItem[]>([]);
  const [technicianName, setTechnicianName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [total, setTotal] = useState(0);
  const [invoiceCreatedAt] = useState(() => new Date());
  const [customProductPresets, setCustomProductPresets] = useState<ProductPreset[]>([]);
  const [hasLoadedStoredData, setHasLoadedStoredData] = useState(false);

  const decimalToHoursMinutes = useCallback((decimalHours: number) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  const hoursMinutesToDecimal = useCallback((hoursMinutes: string) => {
    const trimmedValue = hoursMinutes.trim();

    if (!trimmedValue) {
      return 0;
    }

    if (!trimmedValue.includes(':')) {
      return parseNumber(trimmedValue);
    }

    const [hours = '0', minutes = '0'] = trimmedValue.split(':');
    return parseNumber(hours) + parseNumber(minutes) / 60;
  }, []);

  const getHoursFromTimeRange = useCallback((startTimeValue: string, endTimeValue: string) => {
    if (!startTimeValue || !endTimeValue) {
      return null;
    }

    const start = new Date(`2000-01-01T${startTimeValue}:00`);
    const end = new Date(`2000-01-01T${endTimeValue}:00`);
    let diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    return diffMs / (1000 * 60 * 60);
  }, []);

  const addServicePreset = (presetName: string) => {
    setServiceName((currentService) => {
      const currentParts = currentService
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

      if (currentParts.includes(presetName)) {
        return currentService;
      }

      return [...currentParts, presetName].join(', ');
    });
  };

  const addProductLine = (preset?: ProductPreset) => {
    const newLine: ProductLineItem = {
      id: createId(),
      name: preset?.name ?? '',
      quantity: '1',
      pricePerUnit: preset?.price ?? '',
    };

    setProductLines((currentLines) => [...currentLines, newLine]);
  };

  const removeProductLine = (id: string) => {
    setProductLines((currentLines) => currentLines.filter((line) => line.id !== id));
  };

  const saveProductPreset = (line: ProductLineItem) => {
    const name = line.name.trim();
    const price = line.pricePerUnit.trim();

    if (!name || !price) {
      return;
    }

    setCustomProductPresets((currentPresets) => {
      const presetToSave = { name, price };
      const existingPresetIndex = currentPresets.findIndex(
        (preset) => preset.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (existingPresetIndex === -1) {
        return [...currentPresets, presetToSave];
      }

      return currentPresets.map((preset, index) => (index === existingPresetIndex ? presetToSave : preset));
    });
  };

  const removeSavedProductPreset = (name: string) => {
    setCustomProductPresets((currentPresets) =>
      currentPresets.filter((preset) => preset.name.trim().toLowerCase() !== name.trim().toLowerCase())
    );
  };

  const updateProductLine = (id: string, field: keyof Omit<ProductLineItem, 'id'>, value: string) => {
    setProductLines((currentLines) =>
      currentLines.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const getProductLineTotal = useCallback((line: ProductLineItem) => {
    return parseNumber(line.quantity) * parseNumber(line.pricePerUnit);
  }, []);

  const productTotal = useMemo(() => {
    return productLines.reduce((sum, line) => sum + getProductLineTotal(line), 0);
  }, [getProductLineTotal, productLines]);

  const autoCalculatedHours = useMemo(
    () => getHoursFromTimeRange(startTime, endTime),
    [endTime, getHoursFromTimeRange, startTime]
  );
  const isHoursAutoCalculated = autoCalculatedHours !== null;
  const workHours = useMemo(
    () => autoCalculatedHours ?? hoursMinutesToDecimal(hoursWorked),
    [autoCalculatedHours, hoursMinutesToDecimal, hoursWorked]
  );
  const laborTotal = parseNumber(hourlyRate) * workHours;

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      const savedProductPresets = window.localStorage.getItem(CUSTOM_PRODUCTS_STORAGE_KEY);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as Partial<SavedDraft>;

        setHourlyRate(typeof draft.hourlyRate === 'string' ? draft.hourlyRate : '');
        setHoursWorked(typeof draft.hoursWorked === 'string' ? draft.hoursWorked : '');
        setStartTime(typeof draft.startTime === 'string' ? draft.startTime : '');
        setEndTime(typeof draft.endTime === 'string' ? draft.endTime : '');
        setTechnicianName(typeof draft.technicianName === 'string' ? draft.technicianName : '');
        setClientName(typeof draft.clientName === 'string' ? draft.clientName : '');
        setClientAddress(typeof draft.clientAddress === 'string' ? draft.clientAddress : '');
        setServiceName(typeof draft.serviceName === 'string' ? draft.serviceName : '');
        setProductLines(Array.isArray(draft.productLines) ? draft.productLines.filter(isProductLineItem) : []);
      }

      if (savedProductPresets) {
        const products = JSON.parse(savedProductPresets);
        setCustomProductPresets(Array.isArray(products) ? products.filter(isProductPreset) : []);
      }
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(CUSTOM_PRODUCTS_STORAGE_KEY);
    } finally {
      setHasLoadedStoredData(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredData) {
      return;
    }

    const draft: SavedDraft = {
      hourlyRate,
      hoursWorked,
      startTime,
      endTime,
      productLines,
      technicianName,
      clientName,
      clientAddress,
      serviceName,
    };

    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    clientAddress,
    clientName,
    endTime,
    hasLoadedStoredData,
    hourlyRate,
    hoursWorked,
    productLines,
    serviceName,
    startTime,
    technicianName,
  ]);

  useEffect(() => {
    if (!hasLoadedStoredData) {
      return;
    }

    window.localStorage.setItem(CUSTOM_PRODUCTS_STORAGE_KEY, JSON.stringify(customProductPresets));
  }, [customProductPresets, hasLoadedStoredData]);

  useEffect(() => {
    if (autoCalculatedHours === null) {
      return;
    }

    const formattedHours = decimalToHoursMinutes(autoCalculatedHours);

    if (formattedHours !== hoursWorked) {
      setHoursWorked(formattedHours);
    }
  }, [autoCalculatedHours, decimalToHoursMinutes, hoursWorked]);

  useEffect(() => {
    setTotal(laborTotal + productTotal);
  }, [laborTotal, productTotal]);

  const invoiceData: InvoiceData = useMemo(() => {
    const invoiceLines: InvoiceLine[] = [];
    const dueDate = new Date(invoiceCreatedAt);
    dueDate.setDate(dueDate.getDate() + 30);

    if (workHours > 0 || hourlyRate || serviceName) {
      const description = serviceName.trim() || 'Labor';

      invoiceLines.push({
        description,
        quantity: workHours ? decimalToHoursMinutes(workHours) : '1',
        rate: parseNumber(hourlyRate),
        amount: laborTotal,
      });
    }

    productLines.forEach((line) => {
      invoiceLines.push({
        description: line.name.trim() || 'Custom item',
        quantity: line.quantity || '0',
        rate: parseNumber(line.pricePerUnit),
        amount: getProductLineTotal(line),
      });
    });

    return {
      invoiceNumber: `INV-${invoiceCreatedAt.getFullYear()}${(invoiceCreatedAt.getMonth() + 1).toString().padStart(2, '0')}${invoiceCreatedAt
        .getDate()
        .toString()
        .padStart(2, '0')}-${invoiceCreatedAt.getHours().toString().padStart(2, '0')}${invoiceCreatedAt
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
      invoiceDate: invoiceCreatedAt.toLocaleDateString('en-US'),
      invoiceDueDate: dueDate.toLocaleDateString('en-US'),
      companyName: COMPANY.name,
      companyPhone: COMPANY.phone,
      logoSrc: COMPANY.logoSrc,
      technicianName,
      clientName: clientName || 'Client',
      clientAddress,
      serviceName,
      lines: invoiceLines.length
        ? invoiceLines
        : [
            {
              description: 'Service',
              quantity: '1',
              rate: 0,
              amount: 0,
            },
          ],
      subtotal: total,
      total,
    };
  }, [
    clientAddress,
    clientName,
    decimalToHoursMinutes,
    getProductLineTotal,
    hourlyRate,
    invoiceCreatedAt,
    laborTotal,
    productLines,
    serviceName,
    technicianName,
    total,
    workHours,
  ]);

  return (
    <>
      <main className="screen-app min-h-screen bg-stone-100 px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 flex flex-col gap-5 border-b border-neutral-300 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Image src={COMPANY.logoSrc} alt="DrillWorks" width={240} height={74} priority className="mb-4 h-12 w-auto" />
              <h1 className="text-3xl font-bold tracking-normal">Invoice builder</h1>
              <p className="mt-1 text-sm text-neutral-600">{COMPANY.name} · {COMPANY.phone}</p>
            </div>
            <div className="rounded-lg bg-neutral-950 px-5 py-4 text-white shadow-sm">
              <p className="text-xs font-medium uppercase tracking-normal text-stone-300">Total</p>
              <p className="text-3xl font-bold tracking-normal">{formatCurrency(total)}</p>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Job details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="technicianName" className="mb-2 block text-sm font-medium text-neutral-700">
                    Technician Name
                  </label>
                  <input
                    type="text"
                    id="technicianName"
                    value={technicianName}
                    onChange={(event) => setTechnicianName(event.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="Name on the job"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="clientName" className="mb-2 block text-sm font-medium text-neutral-700">
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      placeholder="Client or company"
                    />
                  </div>
                  <div>
                    <label htmlFor="clientAddress" className="mb-2 block text-sm font-medium text-neutral-700">
                      Client Address
                    </label>
                    <input
                      type="text"
                      id="clientAddress"
                      value={clientAddress}
                      onChange={(event) => setClientAddress(event.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      placeholder="Street, city"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="serviceName" className="mb-2 block text-sm font-medium text-neutral-700">
                    Service
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {SERVICE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => addServicePreset(preset)}
                        className="rounded-lg border border-neutral-300 bg-stone-50 px-3 py-2 text-sm font-medium transition hover:border-neutral-950 hover:bg-white"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="serviceName"
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    placeholder="Custom service"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="hourlyRate" className="mb-2 block text-sm font-medium text-neutral-700">
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      value={hourlyRate}
                      onChange={(event) => setHourlyRate(event.target.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label htmlFor="startTime" className="mb-2 block text-sm font-medium text-neutral-700">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      onInput={(event) => setStartTime(event.currentTarget.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="mb-2 block text-sm font-medium text-neutral-700">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      onInput={(event) => setEndTime(event.currentTarget.value)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hoursWorked" className="mb-2 block text-sm font-medium text-neutral-700">
                    Hours Worked
                  </label>
                  <input
                    type="text"
                    id="hoursWorked"
                    value={hoursWorked}
                    onChange={(event) => {
                      if (!isHoursAutoCalculated) {
                        setHoursWorked(event.target.value);
                      }
                    }}
                    readOnly={isHoursAutoCalculated}
                    className={`w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 ${
                      isHoursAutoCalculated ? 'bg-stone-50 text-neutral-700' : ''
                    }`}
                    placeholder="8:00"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Products & materials</h2>
                <button
                  type="button"
                  onClick={() => addProductLine()}
                  className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
                >
                  Add Custom
                </button>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRODUCT_PRESETS.map((preset) => (
                  <button
                    key={`${preset.name}-${preset.price}`}
                    type="button"
                    onClick={() => addProductLine(preset)}
                    className="min-h-16 rounded-lg border border-neutral-300 bg-stone-50 p-3 text-left transition hover:border-neutral-950 hover:bg-white"
                  >
                    <span className="block text-sm font-semibold leading-snug">{preset.name}</span>
                    <span className="mt-1 block text-xs text-neutral-600">{formatCurrency(parseNumber(preset.price))}</span>
                  </button>
                ))}
              </div>

              {customProductPresets.length > 0 && (
                <div className="mb-5">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-700">Saved items</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {customProductPresets.map((preset) => (
                      <div
                        key={`${preset.name}-${preset.price}`}
                        className="group relative min-h-16 rounded-lg border border-neutral-300 bg-white transition hover:border-neutral-950"
                      >
                        <button
                          type="button"
                          onClick={() => addProductLine(preset)}
                          className="h-full w-full p-3 text-left"
                        >
                          <span className="block pr-6 text-sm font-semibold leading-snug">{preset.name}</span>
                          <span className="mt-1 block text-xs text-neutral-600">
                            {formatCurrency(parseNumber(preset.price))}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${preset.name} from saved items`}
                          onClick={() => removeSavedProductPreset(preset.name)}
                          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-sm font-semibold text-neutral-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {productLines.length > 0 ? (
                <div className="space-y-3">
                  {productLines.map((line) => (
                    <div key={line.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="grid gap-3 sm:grid-cols-[1fr_144px_164px]">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-600">Name</label>
                          <input
                            type="text"
                            value={line.name}
                            onChange={(event) => updateProductLine(line.id, 'name', event.target.value)}
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                            placeholder="Item name"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-600">Qty</label>
                          <NumberStepper
                            ariaLabel={`${line.name || 'Item'} quantity`}
                            value={line.quantity}
                            min={0}
                            step={1}
                            onChange={(value) => updateProductLine(line.id, 'quantity', value)}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-600">Price</label>
                          <NumberStepper
                            ariaLabel={`${line.name || 'Item'} price`}
                            value={line.pricePerUnit}
                            min={0}
                            step={0.5}
                            onChange={(value) => updateProductLine(line.id, 'pricePerUnit', value)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200 pt-3">
                        <span className="text-sm font-semibold">{formatCurrency(getProductLineTotal(line))}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => saveProductPreset(line)}
                            disabled={!line.name.trim() || !line.pricePerUnit.trim()}
                            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-950 disabled:cursor-not-allowed disabled:text-neutral-300"
                          >
                            Save Item
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductLine(line.id)}
                            className="text-sm font-medium text-red-600 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-stone-50 p-6 text-center text-sm text-neutral-500">
                  No products added
                </div>
              )}
            </section>
          </div>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Labor</span>
                  <strong>{formatCurrency(laborTotal)}</strong>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Products & materials</span>
                  <strong>{formatCurrency(productTotal)}</strong>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between gap-4 text-lg">
                    <span className="font-semibold">Total to receive</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Invoice export</h2>
              <InvoiceDownloadButton invoiceData={invoiceData} />
            </div>
          </section>
        </div>
      </main>

      <InvoicePrintView invoiceData={invoiceData} />
    </>
  );
}
