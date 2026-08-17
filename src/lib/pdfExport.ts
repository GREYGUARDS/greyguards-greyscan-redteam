import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SentimentDistribution {
  name: string;
  value: number;
}

interface Keyword {
  word: string;
  count: number;
}

interface Source {
  name: string;
  count: number;
  country?: string;
}

interface Person {
  id: string;
  person_name: string;
  person_role: string;
}

interface PersonMention {
  mention_count: number;
  sentiment_score: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
}

interface PersonNarrative {
  narrative_type: string;
  narrative_description?: string;
  severity: string;
  frequency?: number;
}

interface MDMNarrative {
  narrative_type: string;
  narrative_description: string;
  severity: string;
  frequency?: number;
}

interface TimelinePoint {
  date: string;
  mentions: number;
  sentiment?: number;
}

interface GDELTEntity {
  name: string;
  count: number;
}

interface GDELTLocation {
  name: string;
  count: number;
  lat?: number;
  lon?: number;
}

interface GDELTTheme {
  name: string;
  count: number;
}

interface ExportData {
  brandName: string;
  threatLevel: string;
  threatScore: number;
  sentimentDistribution: SentimentDistribution[];
  keywords: Keyword[];
  sources: Source[];
  mdmNarratives: MDMNarrative[];
  emergingPredictions: any[];
  people: Person[];
  personMentions: Record<string, PersonMention>;
  personNarratives: Record<string, PersonNarrative[]>;
  totalMentions: number;
  shortTermSentiment: number;
  longTermSentiment: number;
  timeline: TimelinePoint[];
  gdeltEntities: GDELTEntity[];
  gdeltLocations: GDELTLocation[];
  gdeltThemes: GDELTTheme[];
}

// ===== SHARED DARK DOCUMENT THEME =====
const PAGE_BG: [number, number, number] = [5, 5, 5];
const PANEL_BG: [number, number, number] = [18, 18, 18];
const PANEL_BORDER: [number, number, number] = [48, 48, 48];
const ACCENT: [number, number, number] = [59, 130, 246];
const INK: [number, number, number] = [235, 235, 235];
const INK_MUTED: [number, number, number] = [150, 150, 150];
const TRACK_BG: [number, number, number] = [38, 38, 38];

export const exportToPDF = async (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const innerWidth = pageWidth - 2 * margin;
  const contentTop = 46;
  const contentBottom = pageHeight - 22;
  let yPosition = contentTop;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Fills the whole sheet so every page shares the cover's dark identity
  const paintPageBackground = () => {
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, pageWidth, 2.5, 'F');
  };

  // Continuation header used on every page after the cover
  const drawRunningHeader = () => {
    doc.setTextColor(...INK);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('GREYGUARDS', margin, 16);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK_MUTED);
    doc.text('GREYSCAN // NARRATIVE INTELLIGENCE REPORT', margin, 22);
    doc.text(dateStr, pageWidth - margin, 22, { align: 'right' });

    doc.setDrawColor(...PANEL_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, 27, pageWidth - margin, 27);
  };

  // Background/header are painted once per page only — repainting would erase drawn content
  const chromedPages = new Set<number>();
  const currentPageNumber = () => (doc as any).internal.getCurrentPageInfo().pageNumber as number;

  const initPageChrome = () => {
    const page = currentPageNumber();
    if (chromedPages.has(page)) return;
    chromedPages.add(page);
    paintPageBackground();
    drawRunningHeader();
  };

  const startContentPage = () => {
    initPageChrome();
    yPosition = contentTop;
  };

  const addNewPage = () => {
    doc.addPage();
    startContentPage();
  };

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > contentBottom) {
      addNewPage();
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(22);
    doc.setFillColor(...PANEL_BG);
    doc.rect(margin, yPosition, innerWidth, 10, 'F');
    doc.setFillColor(...ACCENT);
    doc.rect(margin, yPosition, 2, 10, 'F');
    doc.setTextColor(...INK);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 7, yPosition + 6.8);
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'normal');
    yPosition += 15;
  };

  const emptyNote = (message: string) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK_MUTED);
    doc.text(message, margin, yPosition);
    yPosition += 8;
  };

  // Shrinks then, only if needed, trims a label so bar-chart text is never clipped mid-word
  const fitLabel = (text: string, maxWidth: number, baseSize = 7, minSize = 5) => {
    let size = baseSize;
    doc.setFontSize(size);
    while (doc.getTextWidth(text) > maxWidth && size > minSize) {
      size -= 0.25;
      doc.setFontSize(size);
    }
    if (doc.getTextWidth(text) <= maxWidth) return { text, size };

    let trimmed = text;
    while (trimmed.length > 4 && doc.getTextWidth(`${trimmed}...`) > maxWidth) {
      trimmed = trimmed.slice(0, -1);
    }
    return { text: `${trimmed.trimEnd()}...`, size };
  };

  const tableTheme = {
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: INK,
      fillColor: PANEL_BG,
      lineColor: PANEL_BORDER,
      lineWidth: 0.1,
      overflow: 'linebreak' as const,
    },
    headStyles: {
      fillColor: [32, 32, 32] as [number, number, number],
      textColor: INK,
      fontStyle: 'bold' as const,
      lineColor: PANEL_BORDER,
    },
    alternateRowStyles: { fillColor: [12, 12, 12] as [number, number, number] },
    // Keeps autoTable-created pages on the same dark template
    willDrawPage: () => {
      initPageChrome();
    },
  };

  const drawBarChart = (
    rows: { label: string; count: number }[],
    barColor: [number, number, number],
    options?: { labelWidth?: number; barHeight?: number }
  ) => {
    const labelWidth = options?.labelWidth ?? 62;
    const barHeight = options?.barHeight ?? 5;
    const barSpacing = 2.5;
    const valueColumn = 12;
    const trackX = margin + labelWidth + 3;
    const trackWidth = innerWidth - labelWidth - 3 - valueColumn;
    const maxCount = Math.max(...rows.map(r => r.count), 1);

    rows.forEach((row, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);

      doc.setFillColor(...TRACK_BG);
      doc.rect(trackX, barY, trackWidth, barHeight, 'F');

      doc.setFillColor(...barColor);
      doc.rect(trackX, barY, Math.max(0.4, (row.count / maxCount) * trackWidth), barHeight, 'F');

      const fitted = fitLabel(row.label, labelWidth);
      doc.setFontSize(fitted.size);
      doc.setTextColor(...INK);
      doc.text(fitted.text, margin, barY + barHeight - 1.4);

      doc.setFontSize(7);
      doc.setTextColor(...INK_MUTED);
      doc.text(row.count.toString(), pageWidth - margin, barY + barHeight - 1.4, { align: 'right' });
    });

    yPosition += rows.length * (barHeight + barSpacing) + 8;
  };

  const getThreatColor = (level: string): [number, number, number] => {
    switch (level.toLowerCase()) {
      case 'critical': return [220, 38, 38];
      case 'high': return [234, 88, 12];
      case 'medium': return [234, 179, 8];
      default: return [34, 197, 94];
    }
  };

  const getSeverityColor = (severity: string): [number, number, number] => {
    switch (severity.toLowerCase()) {
      case 'critical': return [248, 113, 113];
      case 'high': return [251, 146, 60];
      case 'moderate': return [250, 204, 21];
      default: return [180, 180, 180];
    }
  };

  const trendLabel = (value: number) => (value > 0 ? 'UP' : value < 0 ? 'DOWN' : 'FLAT');
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`;

  // ===== SINGLE SOURCE OF TRUTH FOR MENTION COUNTS =====
  const positive = data.sentimentDistribution.find(s => s.name === 'Positive')?.value || 0;
  const negative = data.sentimentDistribution.find(s => s.name === 'Negative')?.value || 0;
  const neutral = data.sentimentDistribution.find(s => s.name === 'Neutral')?.value || 0;
  const total = positive + negative + neutral;

  const rawTimeline = data.timeline || [];
  const rawTimelineSum = rawTimeline.reduce((sum, point) => sum + (point.mentions || 0), 0);

  // Every mention figure in the report derives from this one number
  const totalMentions = total > 0 ? total : (data.totalMentions || rawTimelineSum || 0);

  // Rescale the timeline so its daily counts sum to the same corpus size
  const timeline: TimelinePoint[] =
    rawTimelineSum > 0 && totalMentions > 0
      ? rawTimeline.map(point => ({
          ...point,
          mentions: Math.max(0, Math.round(((point.mentions || 0) / rawTimelineSum) * totalMentions)),
        }))
      : rawTimeline;

  const posPercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negPercent = total > 0 ? Math.round((negative / total) * 100) : 0;
  const neuPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;

  const threatColor = getThreatColor(data.threatLevel);

  // ===== COVER PAGE =====
  paintPageBackground();
  chromedPages.add(currentPageNumber());

  doc.setTextColor(...INK);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('GREYGUARDS', pageWidth / 2, 60, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK_MUTED);
  doc.text('GREYSCAN – NARRATIVE INTELLIGENCE SCANNER', pageWidth / 2, 72, { align: 'center' });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(margin + 40, 85, pageWidth - margin - 40, 85);

  doc.setTextColor(...INK);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('NARRATIVE INTELLIGENCE REPORT', pageWidth / 2, 110, { align: 'center' });

  doc.setFillColor(...PANEL_BG);
  doc.roundedRect(margin + 30, 125, pageWidth - 2 * margin - 60, 25, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setTextColor(...ACCENT);
  doc.text(data.brandName.toUpperCase(), pageWidth / 2, 141, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK_MUTED);
  doc.text(`Report Generated: ${dateStr}`, pageWidth / 2, 165, { align: 'center' });

  // ===== EXECUTIVE SUMMARY BOX (two safe columns, no overlap) =====
  const summaryY = 182;
  const summaryHeight = 86;
  doc.setFillColor(...PANEL_BG);
  doc.roundedRect(margin, summaryY, innerWidth, summaryHeight, 3, 3, 'F');
  doc.setDrawColor(...PANEL_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, summaryY, innerWidth, summaryHeight, 3, 3, 'S');

  doc.setTextColor(...INK);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', margin + 8, summaryY + 13);

  const colLeftX = margin + 8;
  const colRightX = margin + innerWidth / 2 + 2;
  const rowY = [summaryY + 28, summaryY + 41, summaryY + 54, summaryY + 67];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...INK);

  // Left column
  doc.text('Threat Status:', colLeftX, rowY[0]);
  const statusLabelWidth = doc.getTextWidth('Threat Status: ');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...threatColor);
  doc.text(`${data.threatLevel.toUpperCase()} (${data.threatScore}/100)`, colLeftX + statusLabelWidth, rowY[0]);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK);
  doc.text(`Total Mentions Analysed: ${totalMentions}`, colLeftX, rowY[1]);
  doc.text(`Sentiment: ${posPercent}% Positive | ${neuPercent}% Neutral | ${negPercent}% Negative`, colLeftX, rowY[2]);
  doc.text(
    `7-Day Trend: ${trendLabel(data.shortTermSentiment)} ${signed(data.shortTermSentiment)}`,
    colLeftX,
    rowY[3]
  );

  // Right column
  doc.text(`Key People Monitored: ${data.people?.length || 0}`, colRightX, rowY[0]);
  doc.text(`Top Keywords: ${data.keywords?.length || 0} identified`, colRightX, rowY[1]);
  doc.text(`Sources Tracked: ${data.sources?.length || 0}`, colRightX, rowY[2]);
  doc.text(
    `30-Day Trend: ${trendLabel(data.longTermSentiment)} ${signed(data.longTermSentiment)}`,
    colRightX,
    rowY[3]
  );

  // Full-width closing line
  const narrativeCount = data.mdmNarratives?.length || 0;
  const highSeverity =
    data.mdmNarratives?.filter(
      n => n.severity?.toLowerCase() === 'high' || n.severity?.toLowerCase() === 'critical'
    ).length || 0;
  doc.setTextColor(...INK_MUTED);
  doc.text(
    `Active MDM Narratives: ${narrativeCount} (${highSeverity} high/critical severity)`,
    colLeftX,
    summaryY + 79
  );

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('CONFIDENTIAL – FOR AUTHORISED PERSONNEL ONLY', pageWidth / 2, pageHeight - 26, { align: 'center' });
  doc.text('© Greyguards Intelligence', pageWidth / 2, pageHeight - 20, { align: 'center' });

  // ===== MAIN REPORT =====
  addNewPage();

  doc.setTextColor(...INK);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text(data.brandName, margin, yPosition);
  yPosition += 14;

  // ===== THREAT ASSESSMENT WITH GAUGE =====
  checkPageBreak(70);
  drawSectionHeader('Threat Assessment');

  const gaugeX = margin + 40;
  const gaugeY = yPosition + 25;
  const gaugeRadius = 25;
  const arcSteps = 20;

  doc.setDrawColor(...TRACK_BG);
  doc.setLineWidth(6);
  for (let i = 0; i < arcSteps; i++) {
    const startAngle = Math.PI + (Math.PI * i) / arcSteps;
    const endAngle = Math.PI + (Math.PI * (i + 1)) / arcSteps;
    doc.line(
      gaugeX + Math.cos(startAngle) * gaugeRadius,
      gaugeY + Math.sin(startAngle) * gaugeRadius,
      gaugeX + Math.cos(endAngle) * gaugeRadius,
      gaugeY + Math.sin(endAngle) * gaugeRadius
    );
  }

  const filledSteps = Math.floor((data.threatScore / 100) * arcSteps);
  for (let i = 0; i < filledSteps; i++) {
    const stepPercent = i / arcSteps;
    let stepColor: [number, number, number];
    if (stepPercent < 0.25) stepColor = [34, 197, 94];
    else if (stepPercent < 0.5) stepColor = [234, 179, 8];
    else if (stepPercent < 0.75) stepColor = [234, 88, 12];
    else stepColor = [220, 38, 38];

    doc.setDrawColor(...stepColor);
    const startAngle = Math.PI + (Math.PI * i) / arcSteps;
    const endAngle = Math.PI + (Math.PI * (i + 1)) / arcSteps;
    doc.line(
      gaugeX + Math.cos(startAngle) * gaugeRadius,
      gaugeY + Math.sin(startAngle) * gaugeRadius,
      gaugeX + Math.cos(endAngle) * gaugeRadius,
      gaugeY + Math.sin(endAngle) * gaugeRadius
    );
  }

  doc.setLineWidth(0.5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...threatColor);
  doc.text(data.threatScore.toString(), gaugeX, gaugeY + 3, { align: 'center' });

  doc.setFillColor(...threatColor);
  doc.roundedRect(gaugeX - 22, gaugeY + 8, 44, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(data.threatLevel.toUpperCase(), gaugeX, gaugeY + 15, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(...INK_MUTED);
  doc.text('0', gaugeX - gaugeRadius - 5, gaugeY + 3);
  doc.text('100', gaugeX + gaugeRadius + 2, gaugeY + 3);

  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const summaryX = gaugeX + gaugeRadius + 25;
  doc.text(`Total Mentions: ${totalMentions}`, summaryX, yPosition + 5);
  doc.text(`Positive: ${posPercent}%`, summaryX, yPosition + 14);
  doc.text(`Neutral: ${neuPercent}%`, summaryX + 35, yPosition + 14);
  doc.text(`Negative: ${negPercent}%`, summaryX + 70, yPosition + 14);
  doc.text(`Short-term: ${signed(data.shortTermSentiment)} (${trendLabel(data.shortTermSentiment)})`, summaryX, yPosition + 23);
  doc.text(`Long-term: ${signed(data.longTermSentiment)} (${trendLabel(data.longTermSentiment)})`, summaryX + 50, yPosition + 23);

  yPosition += 55;

  // ===== SENTIMENT PIE CHART =====
  if (total > 0) {
    checkPageBreak(80);
    drawSectionHeader('Sentiment Distribution');

    const pieRadius = 22;
    const pieCenterX = margin + pieRadius + 10;
    const pieCenterY = yPosition + pieRadius + 5;

    const segments = [
      { name: 'Positive', value: positive, color: [34, 197, 94] as [number, number, number] },
      { name: 'Neutral', value: neutral, color: [156, 163, 175] as [number, number, number] },
      { name: 'Negative', value: negative, color: [239, 68, 68] as [number, number, number] },
    ].filter(s => s.value > 0);

    let startAngle = -Math.PI / 2;
    segments.forEach(segment => {
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      doc.setFillColor(...segment.color);
      const steps = Math.max(5, Math.ceil(sliceAngle * 10));
      for (let i = 0; i < steps; i++) {
        const a1 = startAngle + (sliceAngle * i) / steps;
        const a2 = startAngle + (sliceAngle * (i + 1)) / steps;
        doc.triangle(
          pieCenterX,
          pieCenterY,
          pieCenterX + Math.cos(a1) * pieRadius,
          pieCenterY + Math.sin(a1) * pieRadius,
          pieCenterX + Math.cos(a2) * pieRadius,
          pieCenterY + Math.sin(a2) * pieRadius,
          'F'
        );
      }
      startAngle += sliceAngle;
    });

    const legendX = pieCenterX + pieRadius + 15;
    let legendY = yPosition + 8;
    doc.setFontSize(8);
    segments.forEach(segment => {
      doc.setFillColor(...segment.color);
      doc.rect(legendX, legendY - 3, 6, 6, 'F');
      doc.setTextColor(...INK);
      const percent = Math.round((segment.value / total) * 100);
      doc.text(`${segment.name}: ${percent}% (${segment.value})`, legendX + 10, legendY + 2);
      legendY += 10;
    });

    doc.setFontSize(7);
    doc.setTextColor(...INK_MUTED);
    doc.text(`Based on ${totalMentions} analysed mentions`, legendX, legendY + 2);

    yPosition = pieCenterY + pieRadius + 12;
  }

  // ===== TIMELINE CHART =====
  if (timeline.length > 0) {
    checkPageBreak(90);
    drawSectionHeader('Mention Timeline');

    const chartWidth = innerWidth - 10;
    const chartHeight = 50;
    const chartX = margin + 10;
    const chartY = yPosition;

    doc.setFillColor(...PANEL_BG);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    doc.setDrawColor(...PANEL_BORDER);
    doc.setLineWidth(0.3);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');

    const mentions = timeline.map(t => t.mentions);
    const maxMentions = Math.max(...mentions, 1);
    const minMentions = Math.min(...mentions, 0);
    const range = maxMentions - minMentions || 1;

    doc.setDrawColor(...TRACK_BG);
    doc.setLineWidth(0.1);
    for (let i = 1; i < 4; i++) {
      const gridY = chartY + (chartHeight / 4) * i;
      doc.line(chartX, gridY, chartX + chartWidth, gridY);
    }

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.2);

    const points: [number, number][] = timeline.map((point, index) => {
      const x = chartX + (index / (timeline.length - 1 || 1)) * chartWidth;
      const y = chartY + chartHeight - ((point.mentions - minMentions) / range) * (chartHeight - 8) - 4;
      return [x, y];
    });

    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }

    doc.setFillColor(...ACCENT);
    points.forEach(([x, y]) => doc.circle(x, y, 1.2, 'F'));

    doc.setFontSize(6);
    doc.setTextColor(...INK_MUTED);
    doc.text(maxMentions.toString(), chartX - 2, chartY + 4, { align: 'right' });
    doc.text(minMentions.toString(), chartX - 2, chartY + chartHeight - 1, { align: 'right' });

    const firstDate = timeline[0]?.date || '';
    const lastDate = timeline[timeline.length - 1]?.date || '';
    doc.text(firstDate.slice(5), chartX, chartY + chartHeight + 6);
    doc.text(lastDate.slice(5), chartX + chartWidth, chartY + chartHeight + 6, { align: 'right' });
    doc.text(
      `Daily mentions – totals ${totalMentions} across the period`,
      chartX + chartWidth / 2,
      chartY + chartHeight + 6,
      { align: 'center' }
    );

    yPosition = chartY + chartHeight + 12;
  }

  // ===== MDM NARRATIVES =====
  checkPageBreak(60);
  drawSectionHeader('Active MDM Narratives');

  if (data.mdmNarratives && data.mdmNarratives.length > 0) {
    const narrativeData = data.mdmNarratives.slice(0, 8).map(n => [
      (n.narrative_type || 'Unknown').toUpperCase(),
      (n.severity || 'Unknown').toUpperCase(),
      (n.narrative_description || '').substring(0, 70) + ((n.narrative_description?.length || 0) > 70 ? '...' : ''),
      n.frequency?.toString() || '-',
    ]);

    autoTable(doc, {
      ...tableTheme,
      startY: yPosition,
      head: [['Type', 'Severity', 'Description', 'Freq']],
      body: narrativeData,
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 12, halign: 'right' },
      },
      didParseCell: hookData => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          hookData.cell.styles.textColor = getSeverityColor((hookData.cell.raw as string).toLowerCase());
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  } else {
    emptyNote('No active MDM narratives detected');
  }

  // ===== EMERGING PREDICTIONS =====
  checkPageBreak(45);
  drawSectionHeader('Emerging Narrative Predictions');

  if (data.emergingPredictions && data.emergingPredictions.length > 0) {
    const predictionData = data.emergingPredictions.slice(0, 5).map(p => [
      p.narrative || p.prediction || '-',
      `${p.confidence || p.probability || 0}%`,
      p.timeframe || p.trajectory || '-',
    ]);

    autoTable(doc, {
      ...tableTheme,
      startY: yPosition,
      head: [['Prediction', 'Confidence', 'Status']],
      body: predictionData,
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 32 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 8;
  } else {
    emptyNote('No emerging predictions detected');
  }

  // ===== KEYWORDS =====
  checkPageBreak(80);
  drawSectionHeader('Top Keywords');
  if (data.keywords && data.keywords.length > 0) {
    drawBarChart(
      data.keywords.slice(0, 8).map(k => ({ label: k.word, count: k.count })),
      ACCENT
    );
  } else {
    emptyNote('No keywords extracted');
  }

  // ===== GDELT ENTITIES =====
  if (data.gdeltEntities && data.gdeltEntities.length > 0) {
    checkPageBreak(70);
    drawSectionHeader('Key Entities (GDELT)');
    drawBarChart(
      data.gdeltEntities.slice(0, 6).map(e => ({ label: e.name, count: e.count })),
      [147, 51, 234],
      { labelWidth: 70 }
    );
  }

  // ===== GDELT THEMES =====
  if (data.gdeltThemes && data.gdeltThemes.length > 0) {
    checkPageBreak(70);
    drawSectionHeader('Top Themes (GDELT)');
    drawBarChart(
      data.gdeltThemes.slice(0, 6).map(t => ({ label: t.name.replace(/_/g, ' '), count: t.count })),
      [249, 115, 22],
      { labelWidth: 74 }
    );
  }

  // ===== GDELT LOCATIONS =====
  if (data.gdeltLocations && data.gdeltLocations.length > 0) {
    checkPageBreak(60);
    drawSectionHeader('Geographic Distribution (GDELT)');
    drawBarChart(
      data.gdeltLocations.slice(0, 8).map(l => ({ label: l.name, count: l.count })),
      [20, 184, 166],
      { labelWidth: 66, barHeight: 4.5 }
    );
  }

  // ===== SOURCES =====
  checkPageBreak(60);
  drawSectionHeader('Data Sources');
  if (data.sources && data.sources.length > 0) {
    drawBarChart(
      data.sources.slice(0, 8).map(s => ({ label: s.name, count: s.count })),
      [34, 197, 94],
      { labelWidth: 66, barHeight: 4.5 }
    );
  } else {
    emptyNote('No sources tracked');
  }

  // ===== KEY PEOPLE =====
  checkPageBreak(60);
  drawSectionHeader('Key People Intelligence');

  if (data.people && data.people.length > 0) {
    const peopleData = data.people.map(person => {
      const mentions = data.personMentions[person.id] || { mention_count: 0, sentiment_score: 0 };
      const narratives = data.personNarratives[person.id] || [];
      const highRisk = narratives.filter(n => n.severity === 'high' || n.severity === 'critical').length;

      return [
        person.person_name,
        person.person_role,
        mentions.mention_count.toString(),
        `${mentions.sentiment_score > 0 ? '+' : ''}${mentions.sentiment_score}`,
        narratives.length.toString(),
        highRisk > 0 ? `${highRisk} HIGH RISK` : '-',
      ];
    });

    autoTable(doc, {
      ...tableTheme,
      startY: yPosition,
      head: [['Name', 'Role', 'Mentions', 'Sentiment', 'Narratives', 'Risk']],
      body: peopleData,
      styles: { ...tableTheme.styles, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 26 },
      },
      didParseCell: hookData => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          const risk = hookData.cell.raw as string;
          if (risk.includes('HIGH RISK')) {
            hookData.cell.styles.textColor = [248, 113, 113];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    for (const person of data.people) {
      const narratives = data.personNarratives[person.id] || [];
      if (narratives.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...INK);
        doc.text(`${person.person_name} - Active Narratives`, margin, yPosition);
        yPosition += 5;

        const narrativeData = narratives.slice(0, 5).map(n => [
          n.narrative_type.toUpperCase(),
          n.severity.toUpperCase(),
          (n.narrative_description || '-').substring(0, 60) + ((n.narrative_description?.length || 0) > 60 ? '...' : ''),
        ]);

        autoTable(doc, {
          ...tableTheme,
          startY: yPosition,
          head: [['Type', 'Severity', 'Description']],
          body: narrativeData,
          columnStyles: {
            0: { cellWidth: 34 },
            1: { cellWidth: 22 },
            2: { cellWidth: 'auto' },
          },
          didParseCell: hookData => {
            if (hookData.section === 'body' && hookData.column.index === 1) {
              hookData.cell.styles.textColor = getSeverityColor((hookData.cell.raw as string).toLowerCase());
            }
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
      }
    }
  } else {
    emptyNote('No key people identified');
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PANEL_BORDER);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setTextColor(...INK_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('GREYGUARDS // AI-Powered Narrative Intelligence', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  doc.save(`${data.brandName}_narrative_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
