import jsPDF from 'jspdf';
import * as fs from 'fs';
(jsPDF as any).prototype.save = function (name: string) {
  fs.writeFileSync('/tmp/pdfqa/out.pdf', Buffer.from(this.output('arraybuffer')));
  return this;
};
const { exportToPDF } = await import('./src/lib/pdfExport.ts');
const kw = ['arc reactor technology','supply chain','defence contract','whistleblower','regulatory probe','labour dispute','shareholder revolt','synthetic media'];
await exportToPDF({
  brandName: 'Stark Industries',
  threatLevel: 'high', threatScore: 72,
  sentimentDistribution: [{name:'Positive',value:28},{name:'Neutral',value:39},{name:'Negative',value:23}] as any,
  keywords: kw.map((w,i)=>({word:w,count:40-i*4})),
  sources: ['Reuters','The Guardian Online','Hacker News','Mastodon Social','Bluesky','Google News RSS','Reddit r/worldnews','Daily Mail'].map((n,i)=>({name:n,count:30-i*3})),
  mdmNarratives: [
    {narrative_type:'disinformation',narrative_description:'Fabricated claims about reactor safety circulated by coordinated accounts across multiple platforms simultaneously.',severity:'critical',frequency:12},
    {narrative_type:'misinformation',narrative_description:'Misread earnings data spreading organically.',severity:'moderate',frequency:5},
    {narrative_type:'malinformation',narrative_description:'Leaked internal memo shared out of context.',severity:'high',frequency:8},
  ],
  emergingPredictions: [{narrative:'Escalating regulatory scrutiny narrative in EU press',confidence:74,timeframe:'2-3 weeks'}],
  people: [{id:'1',person_name:'Anthony Stark',person_role:'Chief Executive Officer'},{id:'2',person_name:'Pepper Potts',person_role:'Chair of the Board'}],
  personMentions: {'1':{mention_count:34,sentiment_score:-6,positive_count:5,negative_count:12,neutral_count:17},'2':{mention_count:12,sentiment_score:3,positive_count:6,negative_count:2,neutral_count:4}},
  personNarratives: {'1':[{narrative_type:'disinformation',narrative_description:'Claims of falsified test results',severity:'high'}]},
  totalMentions: 5,
  shortTermSentiment: 2.4, longTermSentiment: -1.8,
  timeline: Array.from({length:14},(_,i)=>({date:`2026-05-${String(i+1).padStart(2,'0')}`,mentions:Math.round(20+35*Math.sin(i/2))})),
  gdeltEntities: ['US Department of Defense','European Commission','Wakanda Outreach Centre','Hammer Industries','United Nations','Senate Armed Services Committee'].map((n,i)=>({name:n,count:25-i*3})),
  gdeltLocations: ['United States','United Kingdom','Malibu, California','Brussels','Sokovia','Japan','Germany','New York City'].map((n,i)=>({name:n,count:22-i*2})),
  gdeltThemes: ['MILITARY_TECHNOLOGY','ECON_STOCKMARKET','CORRUPTION_ALLEGATIONS','ENV_NUCLEARPOWER','LEGISLATION','TAX_FNCACT'].map((n,i)=>({name:n,count:18-i*2})),
} as any);
console.log('ok');
