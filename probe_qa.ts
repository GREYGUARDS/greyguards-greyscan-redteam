import jsPDF from 'jspdf';
console.log(typeof (jsPDF as any).prototype.save, Object.keys(jsPDF).slice(0,10));
