'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface ProductLine {
    description: string;
    quantity: string;
    rate: string;
}

interface InvoiceData {
    logo: string;
    logoWidth: number;
    title: string;
    companyName: string;
    name: string;
    companyAddress: string;
    companyAddress2: string;
    companyCountry: string;
    billTo: string;
    clientName: string;
    clientAddress: string;
    clientAddress2: string;
    clientCountry: string;
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
    productLines: ProductLine[];
    subTotalLabel: string;
    taxLabel: string;
    totalLabel: string;
    currency: string;
    notesLabel: string;
    notes: string;
    termLabel: string;
    term: string;
}

interface Props {
    pdfMode: boolean;
    data: InvoiceData;
}

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        paddingTop: 30,
        paddingLeft: 60,
        paddingRight: 60,
        lineHeight: 1.5,
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    companyInfo: {
        flex: 1,
    },
    clientInfo: {
        flex: 1,
    },
    invoiceInfo: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 5,
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 5,
    },
    description: {
        flex: 3,
    },
    quantity: {
        flex: 1,
        textAlign: 'center',
    },
    rate: {
        flex: 1,
        textAlign: 'right',
    },
    amount: {
        flex: 1,
        textAlign: 'right',
    },
    totals: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: 200,
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    notes: {
        marginTop: 30,
    },
});

const InvoicePage: React.FC<Props> = ({ data }) => {
    const calculateAmount = (quantity: string, rate: string) => {
        return (parseFloat(quantity) * parseFloat(rate)).toFixed(2);
    };

    const calculateSubTotal = () => {
        return data.productLines.reduce((sum, line) => {
            return sum + (parseFloat(line.quantity) * parseFloat(line.rate));
        }, 0).toFixed(2);
    };

    const subTotal = calculateSubTotal();
    const tax = 0; // No tax for now
    const total = parseFloat(subTotal) + tax;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.title}>{data.title}</Text>
                        <Text>{data.companyName}</Text>
                        <Text>{data.companyAddress}</Text>
                        <Text>{data.companyAddress2}</Text>
                        <Text>{data.companyCountry}</Text>
                    </View>
                </View>

                {/* Invoice Info */}
                <View style={styles.invoiceInfo}>
                    <View style={styles.clientInfo}>
                        <Text style={{ fontWeight: 'bold' }}>{data.billTo}</Text>
                        <Text>{data.clientName}</Text>
                        <Text>{data.clientAddress}</Text>
                        <Text>{data.clientAddress2}</Text>
                        <Text>{data.clientCountry}</Text>
                    </View>
                    <View>
                        <Text>{data.invoiceTitleLabel}: {data.invoiceTitle}</Text>
                        <Text>{data.invoiceDateLabel}: {data.invoiceDate}</Text>
                        <Text>{data.invoiceDueDateLabel}: {data.invoiceDueDate}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.description}>{data.productLineDescription}</Text>
                        <Text style={styles.quantity}>{data.productLineQuantity}</Text>
                        <Text style={styles.rate}>{data.productLineQuantityRate}</Text>
                        <Text style={styles.amount}>{data.productLineQuantityAmount}</Text>
                    </View>

                    {data.productLines.map((line, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.description}>{line.description}</Text>
                            <Text style={styles.quantity}>{line.quantity}</Text>
                            <Text style={styles.rate}>{data.currency}{line.rate}</Text>
                            <Text style={styles.amount}>{data.currency}{calculateAmount(line.quantity, line.rate)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalRow}>
                        <Text>{data.subTotalLabel}:</Text>
                        <Text>{data.currency}{subTotal}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text>{data.taxLabel}:</Text>
                        <Text>{data.currency}{tax.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
                        <Text style={{ fontWeight: 'bold' }}>{data.totalLabel}:</Text>
                        <Text style={{ fontWeight: 'bold' }}>{data.currency}{total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Notes */}
                <View style={styles.notes}>
                    <Text style={{ fontWeight: 'bold' }}>{data.notesLabel}:</Text>
                    <Text>{data.notes}</Text>
                </View>

                {/* Terms */}
                <View style={styles.notes}>
                    <Text style={{ fontWeight: 'bold' }}>{data.termLabel}:</Text>
                    <Text>{data.term}</Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePage;
