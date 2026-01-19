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

  // ===== HEADER =====
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
  const dateStr = new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 30);
  
  yPosition = 50;

  // ===== BRAND NAME =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.brandName, margin, yPosition);
  yPosition += 15;

  // ===== THREAT ASSESSMENT =====
  drawSectionHeader('Threat Assessment');
  
  const threatColor = getThreatColor(data.threatLevel);
  doc.setFillColor(...threatColor);
  doc.roundedRect(margin, yPosition, 80, 25, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.threatLevel.toUpperCase(), margin + 10, yPosition + 10);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Score: ${data.threatScore}/100`, margin + 10, yPosition + 20);
  
  // Sentiment summary next to threat
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  const positive = data.sentimentDistribution.find(s => s.name === 'Positive')?.value || 0;
  const negative = data.sentimentDistribution.find(s => s.name === 'Negative')?.value || 0;
  const neutral = data.sentimentDistribution.find(s => s.name === 'Neutral')?.value || 0;
  const total = positive + negative + neutral;
  
  doc.text(`Total Mentions: ${data.totalMentions}`, margin + 100, yPosition + 8);
  doc.text(`Positive: ${total > 0 ? Math.round(positive / total * 100) : 0}%`, margin + 100, yPosition + 16);
  doc.text(`Neutral: ${total > 0 ? Math.round(neutral / total * 100) : 0}%`, margin + 140, yPosition + 16);
  doc.text(`Negative: ${total > 0 ? Math.round(negative / total * 100) : 0}%`, margin + 100, yPosition + 24);
  
  yPosition += 35;

  // ===== SENTIMENT PIE CHART =====
  if (total > 0) {
    drawSectionHeader('Sentiment Distribution');
    
    const pieRadius = 25;
    const pieCenterX = margin + pieRadius + 10;
    const pieCenterY = yPosition + pieRadius;
    
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
      
      // Draw pie slice using path
      doc.setFillColor(...segment.color);
      
      // Create arc path manually
      const steps = 30;
      const path: [number, number][] = [[pieCenterX, pieCenterY]];
      
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (sliceAngle * i) / steps;
        const x = pieCenterX + Math.cos(angle) * pieRadius;
        const y = pieCenterY + Math.sin(angle) * pieRadius;
        path.push([x, y]);
      }
      path.push([pieCenterX, pieCenterY]);
      
      // Draw the slice
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      
      // Move to center, arc around, back to center
      let pathStr = '';
      path.forEach((point, idx) => {
        if (idx === 0) {
          pathStr = `${point[0]} ${point[1]} m `;
        } else {
          pathStr += `${point[0]} ${point[1]} l `;
        }
      });
      
      // Use triangle approximation for pie slices
      const midAngle = startAngle + sliceAngle / 2;
      doc.triangle(
        pieCenterX, pieCenterY,
        pieCenterX + Math.cos(startAngle) * pieRadius, pieCenterY + Math.sin(startAngle) * pieRadius,
        pieCenterX + Math.cos(endAngle) * pieRadius, pieCenterY + Math.sin(endAngle) * pieRadius,
        'F'
      );
      
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
    
    // Draw legend
    const legendX = pieCenterX + pieRadius + 20;
    let legendY = yPosition + 5;
    
    doc.setFontSize(9);
    segments.forEach(segment => {
      doc.setFillColor(...segment.color);
      doc.rect(legendX, legendY - 3, 8, 8, 'F');
      doc.setTextColor(0, 0, 0);
      const percent = Math.round((segment.value / total) * 100);
      doc.text(`${segment.name}: ${percent}% (${segment.value})`, legendX + 12, legendY + 3);
      legendY += 12;
    });
    
    yPosition = pieCenterY + pieRadius + 15;
  }

  // ===== SENTIMENT TREND =====
  drawSectionHeader('Sentiment Trend');
  doc.setFontSize(10);
  doc.text(`Short-term Sentiment (7 days): ${data.shortTermSentiment > 0 ? '+' : ''}${data.shortTermSentiment.toFixed(1)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Long-term Sentiment (30 days): ${data.longTermSentiment > 0 ? '+' : ''}${data.longTermSentiment.toFixed(1)}`, margin, yPosition);
  yPosition += 15;

  // ===== TIMELINE CHART =====
  if (data.timeline && data.timeline.length > 0) {
    checkPageBreak(100);
    drawSectionHeader('Mention Timeline');
    
    const chartWidth = pageWidth - 2 * margin;
    const chartHeight = 60;
    const chartX = margin;
    const chartY = yPosition;
    
    // Draw chart background
    doc.setFillColor(248, 248, 248);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    doc.setDrawColor(200, 200, 200);
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
    doc.setLineWidth(1.5);
    
    const points: [number, number][] = data.timeline.map((point, index) => {
      const x = chartX + (index / (data.timeline.length - 1 || 1)) * chartWidth;
      const y = chartY + chartHeight - ((point.mentions - minMentions) / range) * (chartHeight - 10) - 5;
      return [x, y];
    });
    
    // Draw line segments
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    
    // Draw data points
    doc.setFillColor(59, 130, 246);
    points.forEach(([x, y]) => {
      doc.circle(x, y, 1.5, 'F');
    });
    
    // Draw Y-axis labels
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(maxMentions.toString(), chartX - 2, chartY + 5, { align: 'right' });
    doc.text(minMentions.toString(), chartX - 2, chartY + chartHeight - 2, { align: 'right' });
    
    // Draw X-axis labels (first and last dates)
    const firstDate = data.timeline[0]?.date || '';
    const lastDate = data.timeline[data.timeline.length - 1]?.date || '';
    doc.text(firstDate.slice(5), chartX, chartY + chartHeight + 8); // MM-DD format
    doc.text(lastDate.slice(5), chartX + chartWidth, chartY + chartHeight + 8, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    yPosition = chartY + chartHeight + 15;
  }


// ===== MDM NARRATIVES =====
  drawSectionHeader('Active MDM Narratives');
  
  if (data.mdmNarratives && data.mdmNarratives.length > 0) {
    const narrativeData = data.mdmNarratives.slice(0, 10).map(n => [
      (n.narrative_type || 'Unknown').toUpperCase(),
      (n.severity || 'Unknown').toUpperCase(),
      (n.narrative_description || '').substring(0, 80) + ((n.narrative_description?.length || 0) > 80 ? '...' : ''),
      n.frequency?.toString() || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Severity', 'Description', 'Freq']],
      body: narrativeData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 15 }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const severity = (hookData.cell.raw as string).toLowerCase();
          const color = getSeverityColor(severity);
          hookData.cell.styles.textColor = color;
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No active MDM narratives detected', margin, yPosition);
    yPosition += 10;
  }

  // ===== EMERGING PREDICTIONS =====
  checkPageBreak(50);
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
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No emerging predictions detected', margin, yPosition);
    yPosition += 10;
  }

  // ===== KEYWORDS =====
  checkPageBreak(50);
  drawSectionHeader('Top Keywords');
  
  if (data.keywords && data.keywords.length > 0) {
    const keywordData = data.keywords.slice(0, 15).map(k => [k.word || '', (k.count || 0).toString()]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Keyword', 'Mentions']],
      body: keywordData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30 }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No keywords extracted', margin, yPosition);
    yPosition += 10;
  }

  // ===== SOURCES =====
  checkPageBreak(50);
  drawSectionHeader('Data Sources');
  
  if (data.sources && data.sources.length > 0) {
    const sourceData = data.sources.slice(0, 15).map(s => [
      s.name || '',
      (s.count || 0).toString(),
      s.country || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Source', 'Mentions', 'Country']],
      body: sourceData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('No sources tracked', margin, yPosition);
    yPosition += 10;
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
