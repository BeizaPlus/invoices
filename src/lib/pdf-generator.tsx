import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { formatCurrency } from './calculations';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA-Ek-_EeA.woff2',
      fontWeight: 'bold',
    },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ef4444',
  },
  logoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '40%',
  },
  logo: {
    width: 200,
    height: 60,
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.3,
  },
  titleSection: {
    alignItems: 'flex-end',
    width: '60%',
  },
  documentTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  twoColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  card: {
    border: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
  },
  projectPill: {
    backgroundColor: '#f3f4f6',
    border: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    padding: 8,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#d1d5db',
    padding: 8,
  },
  tableCell: {
    fontSize: 9,
    padding: 4,
  },
  tableCellRight: {
    fontSize: 9,
    padding: 4,
    textAlign: 'right',
  },
  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderTop: 2,
    borderTopColor: '#ef4444',
  },
  tableFooterCell: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 4,
  },
  tableFooterCellRight: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 4,
    textAlign: 'right',
  },
  descriptionBox: {
    border: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 20,
    overflow: 'hidden',
  },
  descriptionHeader: {
    backgroundColor: '#f9fafb',
    borderBottom: 2,
    borderBottomColor: '#d1d5db',
    padding: 10,
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionContent: {
    padding: 12,
    fontSize: 10,
    lineHeight: 1.5,
  },
  ganttContainer: {
    border: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    backgroundColor: '#f9fafb',
  },
  ganttTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  ganttTask: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    color: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  taskName: {
    fontSize: 10,
    color: '#FFFFFF',
    flex: 1,
  },
  taskDuration: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: 1,
    borderTopColor: '#d1d5db',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerColumn: {
    width: '48%',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.3,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 80,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
  },
});

interface InvoicePDFProps {
  invoiceData: any;
  clientData: any;
  companyData: any;
  financial: any;
  options?: {
    includeWatermark?: boolean;
    watermarkText?: string;
  };
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoiceData,
  clientData,
  companyData,
  financial,
  options = {}
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, etaDays: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + etaDays);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {options.includeWatermark && (
          <Text style={styles.watermark}>{options.watermarkText || 'DRAFT'}</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image
              style={styles.logo}
              src={companyData.logo ? `/logos/${companyData.logo}` : '/logos/ActiveLogo.svg'}
            />
            <Text style={styles.companyInfo}>
              {companyData.contactHTML || `${companyData.accName || 'Company Name'}\n${companyData.branch || 'Address'}\n${companyData.vatTin || 'VAT/TIN'}`}
            </Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.documentTitle}>{invoiceData.docType}</Text>
            <Text style={styles.dateRange}>{formatDateRange(invoiceData.startDate, invoiceData.etaDays)}</Text>
          </View>
        </View>

        {/* Bill To and Project Info */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <View style={styles.card}>
              <Text style={styles.clientName}>{clientData.name}</Text>
              <Text style={styles.clientInfo}>Cc: {clientData.cc}</Text>
            </View>

            {invoiceData.docType !== 'Account Info' && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Ship To</Text>
                <View style={styles.card}>
                  <Text style={styles.clientName}>{clientData.shipTo}</Text>
                  <Text style={styles.clientInfo}>Cc: {clientData.shipCc}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Project</Text>
            <Text style={styles.projectPill}>{invoiceData.project || 'Untitled Project'}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>ETA</Text>
            <Text style={styles.clientInfo}>Estimated Completion Time: {invoiceData.etaDays} days</Text>
            <Text style={[styles.clientInfo, { fontSize: 8 }]}>
              ({formatDate(invoiceData.startDate)})
            </Text>
          </View>
        </View>

        {/* Invoice Table */}
        {(invoiceData.docType === 'Invoice' || invoiceData.docType === 'Pro-Forma') && (
          <View style={styles.section}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '26%' }]}>Order Code</Text>
                <Text style={[styles.tableHeaderCell, { width: '34%' }]}>Description</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Quantity</Text>
                <Text style={[styles.tableHeaderCell, { width: '12%' }]}>Rate</Text>
                <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Amount</Text>
              </View>

              {/* Main Item */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '26%' }]}>{invoiceData.project || 'PROJ-001'}</Text>
                <Text style={[styles.tableCell, { width: '34%' }]}>{invoiceData.longDesc || 'Project work'}</Text>
                <Text style={[styles.tableCellRight, { width: '12%' }]}>{invoiceData.qty}</Text>
                <Text style={[styles.tableCellRight, { width: '12%' }]}>{formatCurrency(invoiceData.rate)}</Text>
                <Text style={[styles.tableCellRight, { width: '16%' }]}>{formatCurrency(invoiceData.qty * invoiceData.rate)}</Text>
              </View>

              {/* Resources */}
              {invoiceData.resources?.map((resource: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '26%' }]}>RES-{resource.type.slice(0, 6).toUpperCase()}</Text>
                  <Text style={[styles.tableCell, { width: '34%' }]}>{resource.type}</Text>
                  <Text style={[styles.tableCellRight, { width: '12%' }]}>{resource.hours} hrs</Text>
                  <Text style={[styles.tableCellRight, { width: '12%' }]}>{formatCurrency(resource.rate)}</Text>
                  <Text style={[styles.tableCellRight, { width: '16%' }]}>{formatCurrency(resource.hours * resource.rate)}</Text>
                </View>
              ))}

              {/* Table Footer */}
              <View style={styles.tableFooter}>
                <Text style={[styles.tableFooterCell, { width: '84%' }]}>Subtotal</Text>
                <Text style={[styles.tableFooterCellRight, { width: '16%' }]}>
                  {formatCurrency(financial.subtotal + (financial.resourcesTotal || 0))}
                </Text>
              </View>

              {invoiceData.discount > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '84%' }]}>Discount ({invoiceData.discount}%)</Text>
                  <Text style={[styles.tableCellRight, { width: '16%' }]}>-{formatCurrency(financial.discountAmount)}</Text>
                </View>
              )}

              {invoiceData.showVat && invoiceData.vat > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '84%' }]}>VAT ({invoiceData.vat}%)</Text>
                  <Text style={[styles.tableCellRight, { width: '16%' }]}>{formatCurrency(financial.vatAmount)}</Text>
                </View>
              )}

              <View style={[styles.tableFooter, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.tableFooterCell, { width: '84%' }]}>Total</Text>
                <Text style={[styles.tableFooterCellRight, { width: '16%' }]}>
                  {formatCurrency(invoiceData.totalInclVat ? financial.totalWithVat : financial.total)}
                </Text>
              </View>

              {invoiceData.paid > 0 && (
                <>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '84%' }]}>Amount Paid</Text>
                    <Text style={[styles.tableCellRight, { width: '16%' }]}>{formatCurrency(invoiceData.paid)}</Text>
                  </View>
                  <View style={[styles.tableFooter, { backgroundColor: '#fef3c7' }]}>
                    <Text style={[styles.tableFooterCell, { width: '84%' }]}>Amount Due</Text>
                    <Text style={[styles.tableFooterCellRight, { width: '16%' }]}>{formatCurrency(financial.amountDue)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        {invoiceData.longDesc && (invoiceData.docType !== 'Waybill' && invoiceData.docType !== 'Account Info') && (
          <View style={styles.descriptionBox}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionTitle}>Description</Text>
            </View>
            <View style={styles.descriptionContent}>
              <Text>{invoiceData.longDesc}</Text>
            </View>
          </View>
        )}

        {/* Gantt Chart */}
        {invoiceData.tasks && invoiceData.tasks.length > 0 && (
          <View style={styles.ganttContainer}>
            <Text style={styles.ganttTitle}>Project Timeline</Text>
            {invoiceData.tasks.map((task: any, index: number) => (
              <View key={index} style={styles.ganttTask}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskDuration}>{task.dur} days</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Bank Details</Text>
            <Text style={styles.footerText}>
              {companyData.bankName || 'GT Bank'}{'\n'}
              {companyData.currency || 'Ghana Cedi Account'}{'\n'}
              Account Name: {companyData.accName || 'PixelCraft Designs'}{'\n'}
              Account No: {companyData.accNo || '304 125 384 140'}{'\n'}
              Branch: {companyData.branch || 'KNUST - Ghana'}{'\n'}
              {companyData.swift ? `SWIFT: ${companyData.swift}\n` : ''}
              {companyData.vatTin ? `VAT/TIN: ${companyData.vatTin}` : ''}
            </Text>
          </View>
          <View style={styles.footerColumn}>
            <Text style={styles.footerTitle}>Legal Note</Text>
            <Text style={styles.footerText}>
              Payment is due within 30 days of invoice date. Late payments may incur additional charges.
              Please include invoice number in payment reference.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
