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

export const exportToPDF = async (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper functions
  const addNewPage = () => {
    doc.addPage();
    yPosition = margin;
  };

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 5, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;
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
      case 'critical': return [220, 38, 38];
      case 'high': return [234, 88, 12];
      case 'moderate': return [234, 179, 8];
      default: return [156, 163, 175];
    }
  };

  // Calculate sentiment values for executive summary
  const positive = data.sentimentDistribution.find(s => s.name === 'Positive')?.value || 0;
  const negative = data.sentimentDistribution.find(s => s.name === 'Negative')?.value || 0;
  const neutral = data.sentimentDistribution.find(s => s.name === 'Neutral')?.value || 0;
  const total = positive + negative + neutral;
  const threatColor = getThreatColor(data.threatLevel);

  const dateStr = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ===== COVER PAGE =====
  // Dark background
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative top accent line
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 4, 'F');
  
  // Company branding
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('GREYGUARDS', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('GREYSCAN – NARRATIVE INTELLIGENCE SCANNER', pageWidth / 2, 72, { align: 'center' });
  
  // Separator line
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(margin + 40, 85, pageWidth - margin - 40, 85);
  
  // Report title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('NARRATIVE INTELLIGENCE REPORT', pageWidth / 2, 110, { align: 'center' });
  
  // Brand name box
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(margin + 30, 125, pageWidth - 2 * margin - 60, 25, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(data.brandName.toUpperCase(), pageWidth / 2, 141, { align: 'center' });
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(156, 163, 175);
  doc.text(`Report Generated: ${dateStr}`, pageWidth / 2, 165, { align: 'center' });
  
  // ===== EXECUTIVE SUMMARY BOX =====
  const summaryY = 185;
  doc.setFillColor(20, 20, 20);
  doc.roundedRect(margin, summaryY, pageWidth - 2 * margin, 85, 3, 3, 'F');
  doc.setDrawColor(50, 50, 50);
  doc.roundedRect(margin, summaryY, pageWidth - 2 * margin, 85, 3, 3, 'S');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', margin + 10, summaryY + 15);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  
  // Threat status with color
  doc.text('Threat Status:', margin + 10, summaryY + 30);
  doc.setTextColor(...threatColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`${data.threatLevel.toUpperCase()} (${data.threatScore}/100)`, margin + 50, summaryY + 30);
  
  // Total mentions
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Mentions Analysed: ${data.totalMentions}`, margin + 10, summaryY + 42);
  
  // Sentiment breakdown
  const posPercent = total > 0 ? Math.round(positive / total * 100) : 0;
  const negPercent = total > 0 ? Math.round(negative / total * 100) : 0;
  const neuPercent = total > 0 ? Math.round(neutral / total * 100) : 0;
  doc.text(`Sentiment: ${posPercent}% Positive | ${neuPercent}% Neutral | ${negPercent}% Negative`, margin + 10, summaryY + 54);
  
  // Trends
  const shortTrend = data.shortTermSentiment > 0 ? '↑' : data.shortTermSentiment < 0 ? '↓' : '→';
  const longTrend = data.longTermSentiment > 0 ? '↑' : data.longTermSentiment < 0 ? '↓' : '→';
  doc.text(`7-Day Trend: ${shortTrend} ${data.shortTermSentiment > 0 ? '+' : ''}${data.shortTermSentiment.toFixed(1)}  |  30-Day Trend: ${longTrend} ${data.longTermSentiment > 0 ? '+' : ''}${data.longTermSentiment.toFixed(1)}`, margin + 10, summaryY + 66);
  
  // Active narratives count
  const narrativeCount = data.mdmNarratives?.length || 0;
  const highSeverity = data.mdmNarratives?.filter(n => n.severity?.toLowerCase() === 'high' || n.severity?.toLowerCase() === 'critical').length || 0;
  doc.text(`Active MDM Narratives: ${narrativeCount} (${highSeverity} high/critical severity)`, margin + 10, summaryY + 78);
  
  // Key People count
  const peopleX = pageWidth / 2 + 10;
  doc.text(`Key People Monitored: ${data.people?.length || 0}`, peopleX, summaryY + 42);
  doc.text(`Top Keywords: ${data.keywords?.length || 0} identified`, peopleX, summaryY + 54);
  doc.text(`Sources Tracked: ${data.sources?.length || 0}`, peopleX, summaryY + 66);
  
  // Footer on cover
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('CONFIDENTIAL – FOR AUTHORISED PERSONNEL ONLY', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('© Greyguards Intelligence', pageWidth / 2, pageHeight - 12, { align: 'center' });
  
  // ===== START MAIN REPORT ON NEW PAGE =====
  addNewPage();

  // ===== HEADER ON SUBSEQUENT PAGES =====
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GREYGUARDS', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('NARRATIVE INTELLIGENCE REPORT', margin, 30);
  
  doc.setFontSize(10);
  doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 30);
  
  yPosition = 50;

  // ===== BRAND NAME =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.brandName, margin, yPosition);
  yPosition += 15;

  // ===== THREAT ASSESSMENT WITH GAUGE =====
  checkPageBreak(70);
  drawSectionHeader('Threat Assessment');
  
  // Draw threat gauge
  const gaugeX = margin + 40;
  const gaugeY = yPosition + 25;
  const gaugeRadius = 25;
  
  // Draw gauge background arc (semi-circle)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(6);
  
  // Draw background arc segments
  const arcSteps = 20;
  for (let i = 0; i < arcSteps; i++) {
    const startAngle = Math.PI + (Math.PI * i) / arcSteps;
    const endAngle = Math.PI + (Math.PI * (i + 1)) / arcSteps;
    const x1 = gaugeX + Math.cos(startAngle) * gaugeRadius;
    const y1 = gaugeY + Math.sin(startAngle) * gaugeRadius;
    const x2 = gaugeX + Math.cos(endAngle) * gaugeRadius;
    const y2 = gaugeY + Math.sin(endAngle) * gaugeRadius;
    doc.line(x1, y1, x2, y2);
  }
  
  // Draw colored arc based on score
  const scorePercent = data.threatScore / 100;
  const filledSteps = Math.floor(scorePercent * arcSteps);
  
  for (let i = 0; i < filledSteps; i++) {
    const stepPercent = i / arcSteps;
    let stepColor: [number, number, number];
    if (stepPercent < 0.25) stepColor = [34, 197, 94];      // Green
    else if (stepPercent < 0.5) stepColor = [234, 179, 8];   // Yellow
    else if (stepPercent < 0.75) stepColor = [234, 88, 12];  // Orange
    else stepColor = [220, 38, 38];                          // Red
    
    doc.setDrawColor(...stepColor);
    const startAngle = Math.PI + (Math.PI * i) / arcSteps;
    const endAngle = Math.PI + (Math.PI * (i + 1)) / arcSteps;
    const x1 = gaugeX + Math.cos(startAngle) * gaugeRadius;
    const y1 = gaugeY + Math.sin(startAngle) * gaugeRadius;
    const x2 = gaugeX + Math.cos(endAngle) * gaugeRadius;
    const y2 = gaugeY + Math.sin(endAngle) * gaugeRadius;
    doc.line(x1, y1, x2, y2);
  }
  
  // Draw score in center
  doc.setLineWidth(0.5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...threatColor);
  doc.text(data.threatScore.toString(), gaugeX, gaugeY + 3, { align: 'center' });
  
  // Draw threat level label below gauge
  doc.setFillColor(...threatColor);
  doc.roundedRect(gaugeX - 22, gaugeY + 8, 44, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(data.threatLevel.toUpperCase(), gaugeX, gaugeY + 15, { align: 'center' });
  
  // Draw gauge labels
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text('0', gaugeX - gaugeRadius - 5, gaugeY + 3);
  doc.text('100', gaugeX + gaugeRadius + 2, gaugeY + 3);
  
  // Sentiment summary next to gauge
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const summaryX = gaugeX + gaugeRadius + 25;
  doc.text(`Total Mentions: ${data.totalMentions}`, summaryX, yPosition + 5);
  doc.text(`Positive: ${total > 0 ? Math.round(positive / total * 100) : 0}%`, summaryX, yPosition + 14);
  doc.text(`Neutral: ${total > 0 ? Math.round(neutral / total * 100) : 0}%`, summaryX + 35, yPosition + 14);
  doc.text(`Negative: ${total > 0 ? Math.round(negative / total * 100) : 0}%`, summaryX + 70, yPosition + 14);
  doc.text(`Short-term: ${data.shortTermSentiment > 0 ? '+' : ''}${data.shortTermSentiment.toFixed(1)}`, summaryX, yPosition + 23);
  doc.text(`Long-term: ${data.longTermSentiment > 0 ? '+' : ''}${data.longTermSentiment.toFixed(1)}`, summaryX + 45, yPosition + 23);
  
  yPosition += 55;

  // ===== SENTIMENT PIE CHART =====
  if (total > 0) {
    checkPageBreak(80);
    drawSectionHeader('Sentiment Distribution');
    
    const pieRadius = 22;
    const pieCenterX = margin + pieRadius + 10;
    const pieCenterY = yPosition + pieRadius + 5;
    
    // Pie chart colors
    const pieColors: { name: string; color: [number, number, number] }[] = [
      { name: 'Positive', color: [34, 197, 94] },   // Green
      { name: 'Neutral', color: [156, 163, 175] },  // Gray
      { name: 'Negative', color: [239, 68, 68] }    // Red
    ];
    
    // Calculate angles
    const segments = [
      { name: 'Positive', value: positive, color: pieColors[0].color },
      { name: 'Neutral', value: neutral, color: pieColors[1].color },
      { name: 'Negative', value: negative, color: pieColors[2].color }
    ].filter(s => s.value > 0);
    
    let startAngle = -Math.PI / 2; // Start from top
    
    segments.forEach(segment => {
      const sliceAngle = (segment.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      
      // Draw pie slice using triangles
      doc.setFillColor(...segment.color);
      
      // Fill the arc with small triangles for smooth appearance
      const arcSteps = Math.max(5, Math.ceil(sliceAngle * 10));
      for (let i = 0; i < arcSteps; i++) {
        const a1 = startAngle + (sliceAngle * i) / arcSteps;
        const a2 = startAngle + (sliceAngle * (i + 1)) / arcSteps;
        doc.triangle(
          pieCenterX, pieCenterY,
          pieCenterX + Math.cos(a1) * pieRadius, pieCenterY + Math.sin(a1) * pieRadius,
          pieCenterX + Math.cos(a2) * pieRadius, pieCenterY + Math.sin(a2) * pieRadius,
          'F'
        );
      }
      
      startAngle = endAngle;
    });
    
    // Draw legend to the right of pie
    const legendX = pieCenterX + pieRadius + 15;
    let legendY = yPosition + 8;
    
    doc.setFontSize(8);
    segments.forEach(segment => {
      doc.setFillColor(...segment.color);
      doc.rect(legendX, legendY - 3, 6, 6, 'F');
      doc.setTextColor(0, 0, 0);
      const percent = Math.round((segment.value / total) * 100);
      doc.text(`${segment.name}: ${percent}% (${segment.value})`, legendX + 10, legendY + 2);
      legendY += 10;
    });
    
    yPosition = pieCenterY + pieRadius + 12;
  }


  // ===== TIMELINE CHART =====
  if (data.timeline && data.timeline.length > 0) {
    checkPageBreak(90);
    drawSectionHeader('Mention Timeline');
    
    const chartWidth = pageWidth - 2 * margin - 10;
    const chartHeight = 50;
    const chartX = margin + 10;
    const chartY = yPosition;
    
    // Draw chart background
    doc.setFillColor(248, 248, 248);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'S');
    
    // Get data range
    const mentions = data.timeline.map(t => t.mentions);
    const maxMentions = Math.max(...mentions, 1);
    const minMentions = Math.min(...mentions, 0);
    const range = maxMentions - minMentions || 1;
    
    // Draw grid lines
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    for (let i = 1; i < 4; i++) {
      const gridY = chartY + (chartHeight / 4) * i;
      doc.line(chartX, gridY, chartX + chartWidth, gridY);
    }
    
    // Draw the line chart
    doc.setDrawColor(59, 130, 246); // Blue color
    doc.setLineWidth(1.2);
    
    const points: [number, number][] = data.timeline.map((point, index) => {
      const x = chartX + (index / (data.timeline.length - 1 || 1)) * chartWidth;
      const y = chartY + chartHeight - ((point.mentions - minMentions) / range) * (chartHeight - 8) - 4;
      return [x, y];
    });
    
    // Draw line segments
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    
    // Draw data points
    doc.setFillColor(59, 130, 246);
    points.forEach(([x, y]) => {
      doc.circle(x, y, 1.2, 'F');
    });
    
    // Draw Y-axis labels
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(maxMentions.toString(), chartX - 2, chartY + 4, { align: 'right' });
    doc.text(minMentions.toString(), chartX - 2, chartY + chartHeight - 1, { align: 'right' });
    
    // Draw X-axis labels (first and last dates)
    const firstDate = data.timeline[0]?.date || '';
    const lastDate = data.timeline[data.timeline.length - 1]?.date || '';
    doc.text(firstDate.slice(5), chartX, chartY + chartHeight + 6); // MM-DD format
    doc.text(lastDate.slice(5), chartX + chartWidth, chartY + chartHeight + 6, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
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
      n.frequency?.toString() || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Severity', 'Description', 'Freq']],
      body: narrativeData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 12 }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const severity = (hookData.cell.raw as string).toLowerCase();
          const color = getSeverityColor(severity);
          hookData.cell.styles.textColor = color;
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No active MDM narratives detected', margin, yPosition);
    yPosition += 8;
  }

  // ===== EMERGING PREDICTIONS =====
  checkPageBreak(45);
  drawSectionHeader('Emerging Narrative Predictions');
  
  if (data.emergingPredictions && data.emergingPredictions.length > 0) {
    const predictionData = data.emergingPredictions.slice(0, 5).map(p => [
      p.narrative || p.prediction || '-',
      `${p.confidence || p.probability || 0}%`,
      p.timeframe || p.trajectory || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Prediction', 'Confidence', 'Status']],
      body: predictionData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No emerging predictions detected', margin, yPosition);
    yPosition += 8;
  }

  // ===== KEYWORDS BAR CHART =====
  checkPageBreak(80);
  drawSectionHeader('Top Keywords');
  
  if (data.keywords && data.keywords.length > 0) {
    const topKeywords = data.keywords.slice(0, 8);
    const maxCount = Math.max(...topKeywords.map(k => k.count), 1);
    const barChartX = margin;
    const barChartWidth = pageWidth - 2 * margin;
    const barHeight = 5;
    const barSpacing = 2;
    
    topKeywords.forEach((keyword, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);
      const barWidth = (keyword.count / maxCount) * (barChartWidth - 55);
      
      // Draw bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(barChartX + 45, barY, barChartWidth - 55, barHeight, 'F');
      
      // Draw bar
      doc.setFillColor(59, 130, 246);
      doc.rect(barChartX + 45, barY, barWidth, barHeight, 'F');
      
      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const labelText = keyword.word.length > 10 ? keyword.word.substring(0, 10) + '...' : keyword.word;
      doc.text(labelText, barChartX, barY + 4);
      
      // Draw count
      doc.setTextColor(100, 100, 100);
      doc.text(keyword.count.toString(), barChartX + barChartWidth - 5, barY + 4, { align: 'right' });
    });
    
    yPosition += topKeywords.length * (barHeight + barSpacing) + 8;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No keywords extracted', margin, yPosition);
    yPosition += 8;
  }

  // ===== GDELT ENTITIES BAR CHART =====
  if (data.gdeltEntities && data.gdeltEntities.length > 0) {
    checkPageBreak(70);
    drawSectionHeader('Key Entities (GDELT)');
    
    const topEntities = data.gdeltEntities.slice(0, 6);
    const maxCount = Math.max(...topEntities.map(e => e.count), 1);
    const barChartX = margin;
    const barChartWidth = pageWidth - 2 * margin;
    const barHeight = 5;
    const barSpacing = 2;
    
    topEntities.forEach((entity, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);
      const barWidth = (entity.count / maxCount) * (barChartWidth - 60);
      
      // Draw bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(barChartX + 50, barY, barChartWidth - 60, barHeight, 'F');
      
      // Draw bar (purple color)
      doc.setFillColor(147, 51, 234);
      doc.rect(barChartX + 50, barY, barWidth, barHeight, 'F');
      
      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const labelText = entity.name.length > 12 ? entity.name.substring(0, 12) + '...' : entity.name;
      doc.text(labelText, barChartX, barY + 4);
      
      // Draw count
      doc.setTextColor(100, 100, 100);
      doc.text(entity.count.toString(), barChartX + barChartWidth - 5, barY + 4, { align: 'right' });
    });
    
    yPosition += topEntities.length * (barHeight + barSpacing) + 8;
  }

  // ===== GDELT THEMES BAR CHART =====
  if (data.gdeltThemes && data.gdeltThemes.length > 0) {
    checkPageBreak(70);
    drawSectionHeader('Top Themes (GDELT)');
    
    const topThemes = data.gdeltThemes.slice(0, 6);
    const maxCount = Math.max(...topThemes.map(t => t.count), 1);
    const barChartX = margin;
    const barChartWidth = pageWidth - 2 * margin;
    const barHeight = 5;
    const barSpacing = 2;
    
    topThemes.forEach((theme, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);
      const barWidth = (theme.count / maxCount) * (barChartWidth - 65);
      
      // Draw bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(barChartX + 55, barY, barChartWidth - 65, barHeight, 'F');
      
      // Draw bar (orange color)
      doc.setFillColor(249, 115, 22);
      doc.rect(barChartX + 55, barY, barWidth, barHeight, 'F');
      
      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const labelText = theme.name.replace(/_/g, ' ').length > 14 ? 
        theme.name.replace(/_/g, ' ').substring(0, 14) + '...' : 
        theme.name.replace(/_/g, ' ');
      doc.text(labelText, barChartX, barY + 4);
      
      // Draw count
      doc.setTextColor(100, 100, 100);
      doc.text(theme.count.toString(), barChartX + barChartWidth - 5, barY + 4, { align: 'right' });
    });
    
    yPosition += topThemes.length * (barHeight + barSpacing) + 8;
  }

  // ===== GDELT LOCATIONS =====
  if (data.gdeltLocations && data.gdeltLocations.length > 0) {
    checkPageBreak(60);
    drawSectionHeader('Geographic Distribution (GDELT)');
    
    const topLocations = data.gdeltLocations.slice(0, 8);
    const maxCount = Math.max(...topLocations.map(l => l.count), 1);
    
    // Draw horizontal bar chart for locations
    const barChartX = margin;
    const barChartWidth = pageWidth - 2 * margin;
    const barHeight = 4;
    const barSpacing = 2;
    
    topLocations.forEach((location, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);
      const barWidth = (location.count / maxCount) * (barChartWidth - 50);
      
      // Draw bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(barChartX + 40, barY, barChartWidth - 50, barHeight, 'F');
      
      // Draw bar (teal color)
      doc.setFillColor(20, 184, 166);
      doc.rect(barChartX + 40, barY, barWidth, barHeight, 'F');
      
      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const labelText = location.name.length > 10 ? location.name.substring(0, 10) + '...' : location.name;
      doc.text(labelText, barChartX, barY + 3);
      
      // Draw count
      doc.setTextColor(100, 100, 100);
      doc.text(location.count.toString(), barChartX + barChartWidth - 5, barY + 3, { align: 'right' });
    });
    
    yPosition += topLocations.length * (barHeight + barSpacing) + 8;
  }

  // ===== SOURCES BAR CHART =====
  checkPageBreak(60);
  drawSectionHeader('Data Sources');
  
  if (data.sources && data.sources.length > 0) {
    const topSources = data.sources.slice(0, 8);
    const maxCount = Math.max(...topSources.map(s => s.count), 1);
    const barChartX = margin;
    const barChartWidth = pageWidth - 2 * margin;
    const barHeight = 4;
    const barSpacing = 2;
    
    topSources.forEach((source, index) => {
      const barY = yPosition + index * (barHeight + barSpacing);
      const barWidth = (source.count / maxCount) * (barChartWidth - 50);
      
      // Draw bar background
      doc.setFillColor(240, 240, 240);
      doc.rect(barChartX + 40, barY, barChartWidth - 50, barHeight, 'F');
      
      // Draw bar (green color)
      doc.setFillColor(34, 197, 94);
      doc.rect(barChartX + 40, barY, barWidth, barHeight, 'F');
      
      // Draw label
      doc.setFontSize(6);
      doc.setTextColor(0, 0, 0);
      const labelText = source.name.length > 10 ? source.name.substring(0, 10) + '...' : source.name;
      doc.text(labelText, barChartX, barY + 3);
      
      // Draw count
      doc.setTextColor(100, 100, 100);
      doc.text(source.count.toString(), barChartX + barChartWidth - 5, barY + 3, { align: 'right' });
    });
    
    yPosition += topSources.length * (barHeight + barSpacing) + 8;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No sources tracked', margin, yPosition);
    yPosition += 8;
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
        highRisk > 0 ? `${highRisk} HIGH RISK` : '-'
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Role', 'Mentions', 'Sentiment', 'Narratives', 'Risk']],
      body: peopleData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          const risk = hookData.cell.raw as string;
          if (risk.includes('HIGH RISK')) {
            hookData.cell.styles.textColor = [220, 38, 38];
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Person-specific narratives
    for (const person of data.people) {
      const narratives = data.personNarratives[person.id] || [];
      if (narratives.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${person.person_name} - Active Narratives`, margin, yPosition);
        yPosition += 5;

        const narrativeData = narratives.slice(0, 5).map(n => [
          n.narrative_type.toUpperCase(),
          n.severity.toUpperCase(),
          (n.narrative_description || '-').substring(0, 60) + ((n.narrative_description?.length || 0) > 60 ? '...' : '')
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Type', 'Severity', 'Description']],
          body: narrativeData,
          margin: { left: margin, right: margin },
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255] },
          didParseCell: (hookData) => {
            if (hookData.section === 'body' && hookData.column.index === 1) {
              const severity = (hookData.cell.raw as string).toLowerCase();
              const color = getSeverityColor(severity);
              hookData.cell.styles.textColor = color;
            }
          }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 8;
      }
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No key people identified', margin, yPosition);
    yPosition += 10;
  }

  // ===== FOOTER =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 30, 30);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.text('GREYGUARDS // AI-Powered Narrative Intelligence', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 6);
  }

  // Save the PDF
  doc.save(`${data.brandName}_narrative_report_${new Date().toISOString().split('T')[0]}.pdf`);
};
